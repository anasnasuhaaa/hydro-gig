"""Versioned fixtures, authored by hand. No DB, randomness, clock or mutable session state."""

import json
from pathlib import Path

from app.schemas.contracts import FloodScenario, RoadNetwork
from app.schemas.demo import DemoFrame, DemoManifest

DATA = Path(__file__).with_name("fixtures.json")


class SyntheticProvider:
    def _read(self) -> dict:
        # A fresh validated object per call prevents cross-request mutation.
        return json.loads(DATA.read_text())

    def manifest(self) -> DemoManifest:
        return DemoManifest.model_validate(self._read()["manifest"])

    def network(self) -> RoadNetwork:
        return RoadNetwork.model_validate(self._read()["network"])

    def scenarios(self) -> list[FloodScenario]:
        return [FloodScenario.model_validate(self._read()["scenario"])]

    def frame(self, scenario_id: str, step: str) -> DemoFrame:
        data = self._read()
        if scenario_id != data["scenario"]["scenario_id"] or step not in data["frames"]:
            raise LookupError("Unknown demo scenario or frame")
        frame = DemoFrame.model_validate(data["frames"][step])
        network = self.network()
        edges = {edge.edge_id for edge in network.segments}
        if set(frame.edge_costs) != edges or not set(frame.affected_edge_ids) <= edges:
            raise ValueError("Fixture frame must provide costs for every network edge")
        if {item.edge_id for item in frame.observations} != edges:
            raise ValueError("Fixture observations must reference all network edges")
        if {item.edge_id for item in frame.risk_assessments} != edges:
            raise ValueError("Fixture risks must reference all network edges")
        return frame
