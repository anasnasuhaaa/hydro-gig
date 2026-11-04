from typing import Annotated, Literal

from pydantic import Field, model_validator

from app.schemas.contracts import (
    Contract,
    FloodObservation,
    FloodScenario,
    Identifier,
    Nonnegative,
    RiskAssessment,
    RoadNetwork,
    RouteResult,
    Step,
    TimeStep,
)

SIMULATION_LABEL = "SIMULATED DATA — NOT REAL-TIME FLOOD MONITORING"


class DemoEnvelope(Contract):
    experimental: Literal[True] = True
    provenance: Literal["simulated"] = "simulated"
    label: Literal[SIMULATION_LABEL] = SIMULATION_LABEL


class DemoManifest(DemoEnvelope):
    dataset_id: Identifier
    version: Identifier
    origin: str
    limitations: list[str]
    default_trip: dict[Literal["origin", "pickup", "destination"], Identifier]


class DemoNetwork(DemoEnvelope):
    network: RoadNetwork


class DemoScenarios(DemoEnvelope):
    scenarios: list[FloodScenario]


class DemoFrame(DemoEnvelope):
    scenario_id: Identifier
    network_id: Identifier
    frame: TimeStep
    weighting_version: Identifier
    edge_costs: dict[Identifier, Nonnegative]
    affected_edge_ids: list[Identifier]
    observations: list[FloodObservation]
    risk_assessments: list[RiskAssessment]
    warning: str


class ScreenRequest(Contract):
    origin: Identifier
    pickup: Identifier
    destination: Identifier
    scenario_id: Identifier
    step: Step

    @model_validator(mode="after")
    def distinct_nodes(self) -> "ScreenRequest":
        if len({self.origin, self.pickup, self.destination}) != 3:
            raise ValueError("Origin, pickup and destination must be distinct demo nodes")
        return self


class RouteAlternatives(Contract):
    baseline: RouteResult
    demonstration_weighted: RouteResult


class ScreenResponse(DemoEnvelope):
    request: ScreenRequest
    network_id: Identifier
    frame: DemoFrame
    origin_to_pickup: RouteAlternatives
    pickup_to_destination: RouteAlternatives
    warnings: Annotated[list[str], Field(min_length=1)]
