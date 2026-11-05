import json
from pathlib import Path

import pytest
from pydantic import ValidationError

from app.schemas.experimental import Fixture

PATH = Path(__file__).parents[1] / "experimental/processed/small-v1.json"


def fixture():
    return Fixture.model_validate_json(PATH.read_text())


def test_complete_fixture():
    data = fixture()
    assert (len(data.nodes), len(data.edges), len(data.frames)) == (12, 20, 5)
    assert all(len(f.samples) == 20 for f in data.frames)
    assert data.network_source == data.scenario_source == "unknown"


@pytest.mark.parametrize("mutation", ["endpoint", "weight", "missing_weight", "frame", "time"])
def test_reject_invalid_fixture(mutation):
    data = json.loads(PATH.read_text())
    if mutation == "endpoint":
        data["edges"][0]["target_node"] = "missing"
    elif mutation == "weight":
        data["frames"][0]["samples"]["E_01_02"]["weight"] = -1
    elif mutation == "missing_weight":
        del data["frames"][0]["samples"]["E_01_02"]
    elif mutation == "frame":
        data["frames"].pop()
    else:
        data["frames"][1]["timestamp"] = data["frames"][0]["timestamp"]
    with pytest.raises(ValidationError):
        Fixture.model_validate(data)


def test_api():
    from fastapi.testclient import TestClient

    from app.main import app

    with TestClient(app) as client:
        assert len(client.get("/api/v1/experimental/network").json()["edges"]) == 20
        assert len(client.get("/api/v1/experimental/scenarios").json()["frames"]) == 5
        assert (
            client.get("/api/v1/experimental/scenarios/small-inundation-v1/frames/t4").status_code
            == 200
        )
        assert (
            client.get("/api/v1/experimental/scenarios/small-inundation-v1/frames/t5").status_code
            == 404
        )


def test_routes_all_pairs_against_independent_relaxation():
    from app.schemas.experimental import ScreenRequest
    from app.services.experimental import screen

    data = fixture()
    for frame in data.frames:
        for origin in data.nodes:
            for target in data.nodes:
                result = screen(
                    ScreenRequest(
                        origin=origin.node_id,
                        pickup=target.node_id,
                        destination=origin.node_id,
                        scenario_id=data.scenario_id,
                        step=frame.step,
                    )
                )
                for mode in ("baseline", "weighted"):
                    costs = {
                        e.edge_id: e.length_m
                        if mode == "baseline"
                        else frame.samples[e.edge_id].weight
                        for e in data.edges
                    }
                    distances = {n.node_id: float("inf") for n in data.nodes}
                    distances[origin.node_id] = 0
                    for _ in data.nodes:
                        for e in data.edges:
                            distances[e.target_node] = min(
                                distances[e.target_node],
                                distances[e.source_node] + costs[e.edge_id],
                            )
                    path = getattr(result.origin_to_pickup, mode)
                    expected = distances[target.node_id]
                    if expected == float("inf"):
                        assert path.status == "unreachable"
                    else:
                        assert path.objective_cost == pytest.approx(expected)
                        assert path.objective_cost == pytest.approx(
                            sum(costs[e] for e in path.edge_ids)
                        )
                        edges = {e.edge_id: e for e in data.edges}
                        assert path.distance_m == pytest.approx(
                            sum(edges[e].length_m for e in path.edge_ids)
                        )
                        for index, edge in enumerate(path.edge_ids):
                            assert (edges[edge].source_node, edges[edge].target_node) == tuple(
                                path.node_ids[index : index + 2]
                            )
