import math
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.core.config import Settings, get_settings
from app.main import create_app
from app.schemas.claims import ClaimRequest, ClaimResponse
from app.schemas.contracts import Coordinates, FloodObservation, RiskAssessment, RoadNetwork
from app.schemas.demo import DemoFrame, ScreenRequest, ScreenResponse
from app.services.demo import DemoService
from app.services.routing import DijkstraEngine, FixtureWeighting
from demo.provider import SyntheticProvider

REQUEST = dict(
    origin="A", pickup="C", destination="F", scenario_id="synthetic-corridors-v1", step="t0"
)


@pytest.fixture
def provider():
    return SyntheticProvider()


@pytest.fixture
def service(provider):
    return DemoService(provider, DijkstraEngine(), FixtureWeighting())


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "")
    monkeypatch.setenv("DIRECT_DATABASE_URL", "")
    get_settings.cache_clear()
    with TestClient(create_app()) as client:
        yield client
    get_settings.cache_clear()


def test_demo_endpoints_without_database(client):
    with patch("app.services.system.probe_database", side_effect=AssertionError("No DB")):
        manifest = client.get("/api/v1/demo/manifest")
        assert manifest.status_code == 200
        assert manifest.json()["experimental"] is True
        assert "NOT REAL-TIME" in manifest.json()["label"]
        scenarios = client.get("/api/v1/demo/scenarios").json()
        assert [s["step"] for s in scenarios["scenarios"][0]["time_steps"]] == ["t0", "t1", "t2"]
        network = RoadNetwork.model_validate(client.get("/api/v1/demo/network").json()["network"])
        assert len(network.nodes) == 8
        assert all(edge.length_m > 0 for edge in network.segments)
        response = client.post("/api/v1/demo/screen", json=REQUEST)
        assert response.status_code == 200
        result = ScreenResponse.model_validate(response.json())
        assert result.request.origin == "A"
        assert result.provenance == "simulated"
        assert result.origin_to_pickup.baseline.edge_ids == ["AB", "BC"]
        assert result.pickup_to_destination.baseline.edge_ids == ["CD", "DF"]


def test_fixture_determinism_and_mutation_isolation(provider):
    first = provider.frame(REQUEST["scenario_id"], "t1")
    first.edge_costs["BC"] = 0
    assert provider.frame(REQUEST["scenario_id"], "t1").edge_costs["BC"] == 900
    assert provider.network() == provider.network()
    assert provider.manifest() == provider.manifest()


@pytest.mark.parametrize(
    "step,first,second",
    [
        ("t0", ["AB", "BC"], ["CD", "DF"]),
        ("t1", ["AG", "GC"], ["CE", "EF"]),
        ("t2", ["AB", "BC"], ["CE", "EF"]),
    ],
)
def test_weighted_selection_and_reconstruction(service, provider, step, first, second):
    result = service.screen(ScreenRequest(**{**REQUEST, "step": step}))
    assert result.origin_to_pickup.demonstration_weighted.edge_ids == first
    assert result.pickup_to_destination.demonstration_weighted.edge_ids == second
    assert result.origin_to_pickup.baseline.node_ids == ["A", "B", "C"]
    assert result.origin_to_pickup.baseline.total_length_m == 200
    frame = provider.frame(REQUEST["scenario_id"], step)
    lengths = {edge.edge_id: edge.length_m for edge in provider.network().segments}
    for leg in [result.origin_to_pickup, result.pickup_to_destination]:
        route = leg.demonstration_weighted
        assert route.total_weighted_cost == sum(frame.edge_costs[id] for id in route.edge_ids)
        assert route.total_length_m == sum(lengths[id] for id in route.edge_ids)
        assert route.step == step
        assert len(route.node_ids) == len(route.edge_ids) + 1
    assert service.screen(ScreenRequest(**REQUEST)).frame.frame.step == "t0"


def test_directed_unreachable_is_not_zero_cost(client):
    response = client.post("/api/v1/demo/screen", json={**REQUEST, "origin": "H"})
    assert response.status_code == 200
    route = response.json()["origin_to_pickup"]["baseline"]
    assert route["status"] == "unreachable"
    assert route["edge_ids"] == route["node_ids"] == []
    assert route["total_length_m"] is route["total_weighted_cost"] is None


@pytest.mark.parametrize(
    "changes",
    [
        {"origin": "missing"},
        {"pickup": "missing"},
        {"destination": "missing"},
        {"pickup": "A"},
        {"step": "t9"},
        {"origin": ""},
        {"extra": "not allowed"},
        {"origin": None},
        {"origin": 1},
    ],
)
def test_invalid_screen_requests(client, changes):
    assert client.post("/api/v1/demo/screen", json={**REQUEST, **changes}).status_code == 422
    assert client.post("/api/v1/demo/screen", json={}).status_code == 422


@pytest.mark.parametrize("path", ["missing/frames/t0", "synthetic-corridors-v1/frames/t9"])
def test_unknown_frame_is_404(client, path):
    assert client.get(f"/api/v1/demo/scenarios/{path}").status_code == 404
    assert (
        client.post("/api/v1/demo/screen", json={**REQUEST, "scenario_id": "missing"}).status_code
        == 404
    )


def test_frames_are_explicit_unknown_physical_data(client):
    for step in ["t0", "t1", "t2"]:
        response = client.get(f"/api/v1/demo/scenarios/{REQUEST['scenario_id']}/frames/{step}")
        assert response.status_code == 200
        frame = DemoFrame.model_validate(response.json())
        assert frame.frame.step == step
        assert all(o.depth_m is None and o.velocity_u_mps is None for o in frame.observations)
        assert all(
            r.status == "unavailable" and r.risk_index is None for r in frame.risk_assessments
        )


@pytest.mark.parametrize(
    "mutation",
    ["duplicate_node", "duplicate_edge", "missing_endpoint", "zero_length", "mismatched_crs"],
)
def test_network_rejects_invalid_data(provider, mutation):
    payload = provider.network().model_dump()
    if mutation == "duplicate_node":
        payload["nodes"].append(payload["nodes"][0])
    elif mutation == "duplicate_edge":
        payload["segments"].append(payload["segments"][0])
    elif mutation == "missing_endpoint":
        payload["segments"][0]["target_node"] = "unknown"
    elif mutation == "zero_length":
        payload["segments"][0]["length_m"] = 0
    else:
        payload["crs"] = "EPSG:4326"
    with pytest.raises(ValidationError):
        RoadNetwork.model_validate(payload)


@pytest.mark.parametrize("bad_cost", [-1, math.inf, math.nan])
def test_invalid_costs_fail_closed(provider, bad_cost):
    costs = {edge.edge_id: edge.length_m for edge in provider.network().segments}
    costs["AB"] = bad_cost
    with pytest.raises(ValueError):
        DijkstraEngine().route(
            provider.network(),
            costs,
            "A",
            "F",
            ScreenRequest(**REQUEST),
            "demo_weighted",
            "test-v1",
        )


def test_missing_weights_fail_closed(provider):
    frame = provider.frame(REQUEST["scenario_id"], "t0")
    del frame.edge_costs["AB"]
    with pytest.raises(ValueError):
        FixtureWeighting().costs(provider.network(), frame)


def test_zero_costs_parallel_edges_and_two_way_segments(provider):
    network = RoadNetwork(
        network_id="unit-test",
        provenance="simulated",
        crs=None,
        nodes=[{"node_id": "A"}, {"node_id": "B"}],
        segments=[
            {
                "edge_id": "slow",
                "source_node": "A",
                "target_node": "B",
                "length_m": 9,
                "oneway": True,
            },
            {
                "edge_id": "fast",
                "source_node": "A",
                "target_node": "B",
                "length_m": 4,
                "oneway": False,
            },
        ],
    )
    engine = DijkstraEngine()
    for origin, destination in [("A", "B"), ("B", "A")]:
        route = engine.route(
            network,
            {"slow": 8, "fast": 0},
            origin,
            destination,
            ScreenRequest(**REQUEST),
            "demo_weighted",
            "test-v1",
        )
        assert route.edge_ids == ["fast"]
        assert route.total_weighted_cost == 0
        assert route.total_length_m == 4
    route = engine.route(
        network,
        {"slow": 8, "fast": 0},
        "A",
        "A",
        ScreenRequest(**REQUEST),
        "demo_weighted",
        "test-v1",
    )
    assert route.node_ids == ["A"] and route.edge_ids == [] and route.total_length_m == 0


def test_spatial_temporal_and_risk_validation():
    with pytest.raises(ValidationError):
        Coordinates(crs="EPSG:4326", position=(200, 100))
    with pytest.raises(ValidationError):
        FloodObservation(
            edge_id="AB",
            timestamp="2026-01-01T00:00:00",
            depth_m=None,
            velocity_u_mps=None,
            velocity_v_mps=None,
            provenance="simulated",
        )
    with pytest.raises(ValidationError):
        RiskAssessment(
            edge_id="AB",
            risk_index=0,
            parameter_version="unavailable",
            provenance="simulated",
            status="unavailable",
        )


def test_post_cors_and_untrusted_origin(client):
    response = client.options(
        "/api/v1/demo/screen",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Content-Type",
        },
    )
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:3000"
    response = client.options(
        "/api/v1/demo/screen",
        headers={"Origin": "https://untrusted.test", "Access-Control-Request-Method": "POST"},
    )
    assert response.status_code == 400
    assert "access-control-allow-origin" not in response.headers


def test_claim_contract_does_not_issue_tokens():
    assert ClaimResponse().token is None
    assert ClaimResponse().status == "unavailable"
    with pytest.raises(ValidationError):
        ClaimRequest.model_validate({"trip_id": "trip-1", "token": "fake"})


@pytest.mark.parametrize("origin", ["*", "https://*.example.test", "https://example.test/path"])
def test_cors_configuration_rejects_wildcards_and_paths(origin):
    with pytest.raises(ValidationError):
        Settings(_env_file=None, cors_origins=origin)
