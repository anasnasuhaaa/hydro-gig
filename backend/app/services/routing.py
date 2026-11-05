"""Deterministic routing foundation, with no hydrodynamic or scientific risk formula."""

import heapq
import math
from collections.abc import Mapping

from app.schemas.contracts import CalculationMetadata, Mode, RoadNetwork, RouteResult
from app.schemas.demo import SIMULATION_LABEL, DemoFrame, ScreenRequest


class FixtureWeighting:
    def costs(self, network: RoadNetwork, frame: DemoFrame) -> Mapping[str, float]:
        costs = dict(frame.edge_costs)
        if frame.network_id != network.network_id:
            raise ValueError("Frame and network versions must agree")
        validate_costs(network, costs)
        return costs


def validate_costs(network: RoadNetwork, costs: Mapping[str, float]) -> None:
    if set(costs) != {edge.edge_id for edge in network.segments}:
        raise ValueError("Every edge needs an explicit cost; missing costs are unavailable")
    if any(not math.isfinite(cost) or cost < 0 for cost in costs.values()):
        raise ValueError("Edge costs must be finite and nonnegative")


class DijkstraEngine:
    def route(
        self,
        network: RoadNetwork,
        costs: Mapping[str, float],
        origin: str,
        destination: str,
        request: ScreenRequest,
        mode: Mode,
        weighting_version: str,
    ) -> RouteResult:
        validate_costs(network, costs)
        adjacency: dict[str, list[tuple[str, str, float]]] = {
            node.node_id: [] for node in network.nodes
        }
        lengths = {edge.edge_id: edge.length_m for edge in network.segments}
        for edge in sorted(network.segments, key=lambda edge: edge.edge_id):
            adjacency[edge.source_node].append(
                (edge.target_node, edge.edge_id, costs[edge.edge_id])
            )
            if not edge.oneway:
                adjacency[edge.target_node].append(
                    (edge.source_node, edge.edge_id, costs[edge.edge_id])
                )
        if origin not in adjacency or destination not in adjacency:
            raise ValueError("Unknown node ID in demo network")
        node_ids, edge_ids, cost = shortest_path(adjacency, origin, destination)
        found = cost is not None
        return RouteResult(
            status="found" if found else "unreachable",
            mode=mode,
            node_ids=node_ids,
            edge_ids=edge_ids,
            total_length_m=sum(lengths[edge_id] for edge_id in edge_ids) if found else None,
            total_weighted_cost=cost,
            network_id=network.network_id,
            scenario_id=request.scenario_id,
            step=request.step,
            provenance=network.provenance,
            calculation=CalculationMetadata(
                algorithm="heap-dijkstra",
                engine_version="demo-dijkstra-v1",
                weighting_version=weighting_version,
                cost_unit="m" if mode == "shortest_distance" else "demo_cost_units",
                warnings=[
                    SIMULATION_LABEL,
                    "Fixed-frame calculation; no travel-time forecast or safety guarantee.",
                ],
            ),
        )


def shortest_path(adjacency, origin: str, destination: str):
    """Deterministic heap core shared by demo and quarantined fixture routing."""
    distances = {origin: 0.0}
    previous: dict[str, tuple[str, str]] = {}
    queue = [(0.0, origin)]
    while queue:
        distance, node = heapq.heappop(queue)
        if distance != distances[node]:
            continue
        if node == destination:
            break
        for target, edge_id, cost in adjacency[node]:
            candidate = distance + cost
            if not math.isfinite(candidate):
                raise ValueError("Route cost overflow")
            if candidate < distances.get(target, math.inf):
                distances[target] = candidate
                previous[target] = (node, edge_id)
                heapq.heappush(queue, (candidate, target))
    found = destination in distances
    node_ids, edge_ids = [], []
    if found:
        node = destination
        node_ids.append(node)
        while node != origin:
            node, edge_id = previous[node]
            node_ids.append(node)
            edge_ids.append(edge_id)
        node_ids.reverse()
        edge_ids.reverse()
    return node_ids, edge_ids, distances.get(destination)
