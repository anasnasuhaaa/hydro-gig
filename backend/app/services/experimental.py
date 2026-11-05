from functools import lru_cache
from pathlib import Path

from app.schemas.experimental import Fixture, Frame, Network, Scenarios

DATA = Path(__file__).resolve().parents[2] / "experimental/processed/small-v1.json"


@lru_cache(maxsize=1)
def _load() -> Fixture:
    return Fixture.model_validate_json(DATA.read_text())


def load() -> Fixture:
    # Never expose cached mutable dictionaries to request code.
    return _load().model_copy(deep=True)


def network() -> Network:
    data = load()
    return Network(nodes=data.nodes, edges=data.edges, source_hashes=data.source_hashes)


def scenarios() -> Scenarios:
    return Scenarios(
        frames=[{"step": f.step, "timestamp": f.timestamp.isoformat()} for f in load().frames]
    )


def frame(scenario_id: str, step: str) -> Frame:
    data = load()
    if scenario_id == data.scenario_id:
        for item in data.frames:
            if item.step == step:
                return item
    raise LookupError("Unknown experimental scenario or frame")


def screen(request):
    from app.schemas.experimental import Alternatives, PathResult, ScreenResponse
    from app.services.routing import shortest_path

    data = load()
    selected = frame(request.scenario_id, request.step)
    nodes = {n.node_id for n in data.nodes}
    if not {request.origin, request.pickup, request.destination} <= nodes:
        raise ValueError("Unknown experimental node ID")
    lengths = {e.edge_id: e.length_m for e in data.edges}

    def route(origin, destination, weighted):
        adjacency = {n: [] for n in nodes}
        for edge in sorted(data.edges, key=lambda e: e.edge_id):
            cost = selected.samples[edge.edge_id].weight if weighted else edge.length_m
            adjacency[edge.source_node].append((edge.target_node, edge.edge_id, cost))
        node_ids, edge_ids, cost = shortest_path(adjacency, origin, destination)
        return PathResult(
            status="found" if cost is not None else "unreachable",
            node_ids=node_ids,
            edge_ids=edge_ids,
            distance_m=sum(lengths[e] for e in edge_ids) if cost is not None else None,
            objective_cost=cost,
            cost_unit="experimental_units" if weighted else "m",
        )

    def leg(origin, destination):
        return Alternatives(
            baseline=route(origin, destination, False), weighted=route(origin, destination, True)
        )

    return ScreenResponse(
        request=request,
        frame=selected,
        origin_to_pickup=leg(request.origin, request.pickup),
        pickup_to_destination=leg(request.pickup, request.destination),
    )
