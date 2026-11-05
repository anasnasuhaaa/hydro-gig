"""Quarantined fixture contracts; never certify source geography or physics."""

from typing import Literal

from pydantic import AwareDatetime, model_validator

from app.schemas.contracts import Contract, Finite, Identifier, Nonnegative, Positive


class Metadata(Contract):
    dataset_id: Literal["small-fixture"] = "small-fixture"
    dataset_version: Literal["1"] = "1"
    network_id: Literal["small-directed-v1"] = "small-directed-v1"
    network_version: Literal["1"] = "1"
    scenario_id: Literal["small-inundation-v1"] = "small-inundation-v1"
    network_source: Literal["unknown"] = "unknown"
    scenario_source: Literal["unknown"] = "unknown"
    replay_status: Literal["simulated_unverified"] = "simulated_unverified"
    route_provenance: Literal["experimental_computation"] = "experimental_computation"
    algorithm_version: str = "heap-dijkstra-v1"
    weighting_version: str = "stored-W-v1"
    missing_data: list[str] = ["verified_crs", "source_license", "calibration", "velocity_axes"]
    limitations: list[str] = [
        "Fixture preview only; no verified road coverage.",
        "Stored costs are arbitrary experimental objectives, not safety thresholds.",
        "Fixed historical frames; no live observations or forecasts.",
    ]
    field_provenance: dict[str, str] = {
        "x/y": "unknown source; degree-like display coordinates only",
        "length_m": "unverified source metre values",
        "h_m": "unverified source depth, assumed metres",
        "u_ms/v_ms": "unverified signed components, assumed m/s; axes unknown",
        "weight": "unverified stored dijkstra_weight_W; no formula evaluated",
    }


class Node(Contract):
    node_id: Identifier
    x: Finite
    y: Finite


class Edge(Contract):
    edge_id: Identifier
    source_node: Identifier
    target_node: Identifier
    length_m: Positive
    oneway: Literal[True] = True


class Sample(Contract):
    weight: Nonnegative
    h_m: Nonnegative | None
    u_ms: Finite | None
    v_ms: Finite | None


class Frame(Metadata):
    step: Identifier
    timestamp: AwareDatetime
    samples: dict[str, Sample]


class Fixture(Metadata):
    source_hashes: dict[str, str]
    nodes: list[Node]
    edges: list[Edge]
    frames: list[Frame]

    @model_validator(mode="after")
    def consistent(self):
        nodes = {n.node_id for n in self.nodes}
        edges = {e.edge_id for e in self.edges}
        if len(nodes) != len(self.nodes) or len(edges) != len(self.edges):
            raise ValueError("Duplicate node or edge ID")
        if not nodes or not edges:
            raise ValueError("Empty network")
        if any(e.source_node not in nodes or e.target_node not in nodes for e in self.edges):
            raise ValueError("Unknown endpoint")
        if [f.step for f in self.frames] != ["t0", "t1", "t2", "t3", "t4"]:
            raise ValueError("All five ordered frames required")
        if any(a.timestamp >= b.timestamp for a, b in zip(self.frames, self.frames[1:])):
            raise ValueError("Frame timestamps must increase")
        if any(set(f.samples) != edges for f in self.frames):
            raise ValueError("Every edge/frame join must resolve exactly")
        return self


class Network(Metadata):
    source_hashes: dict[str, str]
    nodes: list[Node]
    edges: list[Edge]


class Scenarios(Metadata):
    frames: list[dict[str, str]]


class ScreenRequest(Contract):
    origin: Identifier
    pickup: Identifier
    destination: Identifier
    scenario_id: Identifier
    step: Identifier


class PathResult(Contract):
    status: Literal["found", "unreachable"]
    node_ids: list[str]
    edge_ids: list[str]
    distance_m: Nonnegative | None
    objective_cost: Nonnegative | None
    cost_unit: Literal["m", "experimental_units"]


class Alternatives(Contract):
    baseline: PathResult
    weighted: PathResult


class ScreenResponse(Metadata):
    request: ScreenRequest
    frame: Frame
    origin_to_pickup: Alternatives
    pickup_to_destination: Alternatives
