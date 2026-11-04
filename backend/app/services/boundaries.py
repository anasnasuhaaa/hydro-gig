"""File-format, weighting and algorithm boundaries for future research integrations."""

from collections.abc import Mapping
from typing import Protocol

from app.schemas.contracts import FloodScenario, Mode, RoadNetwork, RouteResult
from app.schemas.demo import DemoFrame, DemoManifest, ScreenRequest


class NetworkAdapter(Protocol):
    def normalize(
        self, payload: bytes, *, source_crs: str, attribute_map: Mapping[str, str]
    ) -> RoadNetwork:
        """Resolve IDs, units, CRS, direction and parallel edges before returning a graph."""
        ...


class ScenarioProvider(Protocol):
    def manifest(self) -> DemoManifest: ...
    def network(self) -> RoadNetwork: ...
    def scenarios(self) -> list[FloodScenario]: ...
    def frame(self, scenario_id: str, step: str) -> DemoFrame: ...


class WeightingProvider(Protocol):
    def costs(self, network: RoadNetwork, frame: DemoFrame) -> Mapping[str, float]: ...


class RoutingEngine(Protocol):
    def route(
        self,
        network: RoadNetwork,
        costs: Mapping[str, float],
        origin: str,
        destination: str,
        request: ScreenRequest,
        mode: Mode,
        weighting_version: str,
    ) -> RouteResult: ...
