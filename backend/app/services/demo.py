from app.schemas.demo import RouteAlternatives, ScreenRequest, ScreenResponse
from app.services.boundaries import RoutingEngine, ScenarioProvider, WeightingProvider


class DemoService:
    def __init__(
        self, provider: ScenarioProvider, engine: RoutingEngine, weighting: WeightingProvider
    ) -> None:
        self.provider = provider
        self.engine = engine
        self.weighting = weighting

    def screen(self, request: ScreenRequest) -> ScreenResponse:
        network = self.provider.network()
        node_ids = {node.node_id for node in network.nodes}
        if not {request.origin, request.pickup, request.destination} <= node_ids:
            raise ValueError("Unknown node ID in demo network")
        frame = self.provider.frame(request.scenario_id, request.step)
        costs = self.weighting.costs(network, frame)
        baseline_costs = {edge.edge_id: edge.length_m for edge in network.segments}

        def leg(origin: str, destination: str) -> RouteAlternatives:
            return RouteAlternatives(
                baseline=self.engine.route(
                    network,
                    baseline_costs,
                    origin,
                    destination,
                    request,
                    "shortest_distance",
                    "synthetic-lengths-v1",
                ),
                demonstration_weighted=self.engine.route(
                    network,
                    costs,
                    origin,
                    destination,
                    request,
                    "demo_weighted",
                    frame.weighting_version,
                ),
            )

        return ScreenResponse(
            request=request,
            network_id=network.network_id,
            frame=frame,
            origin_to_pickup=leg(request.origin, request.pickup),
            pickup_to_destination=leg(request.pickup, request.destination),
            warnings=[frame.warning, "Scientific risk is unavailable for every demo segment."],
        )
