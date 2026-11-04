"""Normalized integration contracts; independent of SQLAlchemy and input file formats."""

from typing import Annotated, Literal

from pydantic import (
    AwareDatetime,
    BaseModel,
    ConfigDict,
    Field,
    StringConstraints,
    model_validator,
)

Identifier = Annotated[str, StringConstraints(pattern=r"^[A-Za-z0-9][A-Za-z0-9_.:-]{0,79}$")]
Nonnegative = Annotated[float, Field(ge=0, allow_inf_nan=False)]
Positive = Annotated[float, Field(gt=0, allow_inf_nan=False)]
Finite = Annotated[float, Field(allow_inf_nan=False)]
Provenance = Literal["observed", "simulated", "model_predicted"]
Step = Literal["t0", "t1", "t2"]
CRS = Literal["EPSG:4326", "LOCAL:SCHEMATIC"]
Mode = Literal["shortest_distance", "demo_weighted"]


class Contract(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True, allow_inf_nan=False)


class Coordinates(Contract):
    crs: CRS
    position: tuple[Finite, Finite]

    @model_validator(mode="after")
    def valid_geographic_range(self) -> "Coordinates":
        x, y = self.position
        if self.crs == "EPSG:4326" and not (-180 <= x <= 180 and -90 <= y <= 90):
            raise ValueError("EPSG:4326 requires longitude, latitude in degrees")
        return self


class RoadNode(Contract):
    node_id: Identifier
    label: str | None = None
    coordinates: Coordinates | None = None


class LineGeometry(Contract):
    type: Literal["LineString"] = "LineString"
    crs: CRS
    coordinates: Annotated[list[tuple[Finite, Finite]], Field(min_length=2)]

    @model_validator(mode="after")
    def valid_positions(self) -> "LineGeometry":
        for position in self.coordinates:
            Coordinates(crs=self.crs, position=position)
        return self


class RoadSegment(Contract):
    edge_id: Identifier
    source_node: Identifier
    target_node: Identifier
    length_m: Positive
    oneway: bool
    geometry: LineGeometry | None = None
    metadata: dict[str, str] = Field(default_factory=dict)


class RoadNetwork(Contract):
    network_id: Identifier
    provenance: Provenance
    crs: CRS | None
    nodes: Annotated[list[RoadNode], Field(min_length=1)]
    segments: list[RoadSegment]

    @model_validator(mode="after")
    def consistent_graph(self) -> "RoadNetwork":
        node_ids = {node.node_id for node in self.nodes}
        edge_ids = {edge.edge_id for edge in self.segments}
        if len(node_ids) != len(self.nodes) or len(edge_ids) != len(self.segments):
            raise ValueError("Node and edge IDs must be unique")
        for edge in self.segments:
            if edge.source_node not in node_ids or edge.target_node not in node_ids:
                raise ValueError("Segment endpoints must reference network nodes")
            if edge.geometry and edge.geometry.crs != self.crs:
                raise ValueError("Geometry CRS must match network CRS")
        for node in self.nodes:
            if node.coordinates and node.coordinates.crs != self.crs:
                raise ValueError("Coordinate CRS must match network CRS")
        return self


class TimeStep(Contract):
    step: Identifier
    timestamp: AwareDatetime


class FloodScenario(Contract):
    scenario_id: Identifier
    name: Annotated[str, Field(min_length=1)]
    provenance: Provenance
    network_id: Identifier
    time_steps: Annotated[list[TimeStep], Field(min_length=1)]

    @model_validator(mode="after")
    def ordered_steps(self) -> "FloodScenario":
        ids = [frame.step for frame in self.time_steps]
        times = [frame.timestamp for frame in self.time_steps]
        if len(set(ids)) != len(ids) or any(a >= b for a, b in zip(times, times[1:])):
            raise ValueError("Steps must be unique with strictly increasing timestamps")
        return self


class FloodObservation(Contract):
    edge_id: Identifier
    timestamp: AwareDatetime
    depth_m: Nonnegative | None
    velocity_u_mps: Finite | None
    velocity_v_mps: Finite | None
    provenance: Provenance


class RiskAssessment(Contract):
    edge_id: Identifier
    risk_index: Nonnegative | None
    parameter_version: Identifier
    provenance: Provenance
    status: Literal["experimental", "unavailable"]

    @model_validator(mode="after")
    def explicit_missing_risk(self) -> "RiskAssessment":
        if (self.status == "unavailable") != (self.risk_index is None):
            raise ValueError("Unavailable risk must be null; experimental risk requires a value")
        return self


class CalculationMetadata(Contract):
    algorithm: str
    engine_version: Identifier
    weighting_version: Identifier
    cost_unit: Literal["m", "demo_cost_units"]
    warnings: list[str]


class RouteResult(Contract):
    status: Literal["found", "unreachable"]
    mode: Mode
    node_ids: list[Identifier]
    edge_ids: list[Identifier]
    total_length_m: Nonnegative | None
    total_weighted_cost: Nonnegative | None
    network_id: Identifier
    scenario_id: Identifier
    step: Identifier
    provenance: Provenance
    calculation: CalculationMetadata

    @model_validator(mode="after")
    def coherent_result(self) -> "RouteResult":
        if self.status == "unreachable":
            if self.node_ids or self.edge_ids or self.total_length_m is not None:
                raise ValueError("Unreachable routes have empty paths and null totals")
            if self.total_weighted_cost is not None:
                raise ValueError("Unreachable routes have null costs")
        elif (
            len(self.node_ids) != len(self.edge_ids) + 1
            or self.total_length_m is None
            or self.total_weighted_cost is None
        ):
            raise ValueError("Found routes require an ordered path and totals")
        return self
