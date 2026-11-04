# Normalized application data contracts (v1)

Executable definitions: `backend/app/schemas/contracts.py`, `demo.py`, `claims.py`; matching Zod definitions: `frontend/src/lib/contracts/data.ts`, `claims.ts`. These transport contracts are independent of the preliminary SQLAlchemy schema. They do not migrate or persist data.

All objects reject unknown fields. IDs are stable strings matching `[A-Za-z0-9][A-Za-z0-9_.:-]{0,79}`; preserve them verbatim across graph, scenario, observations, route, and evidence references. Numbers must be finite. JSON `null` means unavailable, never zero or safe. `?` below means the field may be omitted; nullable fields without `?` must be present, even when null. Backend validation may normalize numeric JSON types; clients receive and validate normalized JSON numbers.

## Spatial network

| Entity / field | Type | Rules / units |
| --- | --- | --- |
| RoadNode.node_id | ID | Required; unique in network |
| RoadNode.label? | string or null | Human-readable label; default null |
| RoadNode.coordinates? | Coordinates or null | Default null when geographic/drawing positions are unavailable |
| Coordinates.crs | enum | `EPSG:4326` or `LOCAL:SCHEMATIC` |
| Coordinates.position | pair of numbers | EPSG:4326: `[longitude, latitude]` degrees, ranges ±180/±90. LOCAL: unitless schematic x/y, never geographic |
| RoadSegment.edge_id | ID | Unique, including parallel edges; never derive only from node pair |
| RoadSegment.source_node / target_node | ID | Both must reference network nodes |
| RoadSegment.length_m | positive number | Metres; never estimate from unprojected degrees. Demo lengths are authored synthetic metres |
| RoadSegment.oneway | boolean | True: source → target only. False: both traversals share this physical edge ID; ordered route node IDs disambiguate direction |
| RoadSegment.geometry? | LineGeometry or null | Default null; absence is permitted for routing |
| RoadSegment.metadata? | string → string object | Optional traceable source attributes; default empty object; no credentials |
| LineGeometry.type? | `LineString` | Default LineString; at least two coordinate pairs |
| LineGeometry.crs / coordinates | CRS / array of pairs | Explicit CRS, geographic range checks; coordinates follow the same axis order as nodes |
| RoadNetwork.network_id | ID | Versioned immutable normalized-network reference |
| RoadNetwork.provenance | provenance enum | `observed`, `simulated`, `model_predicted` |
| RoadNetwork.crs | CRS or null | Null allowed for topology-only data; all provided node/edge CRS values must match |
| RoadNetwork.nodes / segments | arrays | At least one node; unique node/edge IDs; valid endpoints; segments may be empty |

Only the two explicit CRS conventions are accepted today. A future adapter must transform other CRSs to an approved output CRS or extend the contract deliberately. Unknown source CRS is an integration error, not an implicit EPSG:4326 assumption. Check geometry endpoint correspondence, direction/access rules, topology and licensing in the dataset adapter before using real data. Schematic coordinates must never be written to EPSG:4326 database columns.

## Scenario, observations and risk

| Entity / field | Type | Rules / units |
| --- | --- | --- |
| FloodScenario.scenario_id / network_id | IDs | Immutable scenario version and exact network reference |
| FloodScenario.name | nonempty string | Required |
| FloodScenario.provenance | provenance enum | Required; provenance does not establish validation |
| FloodScenario.time_steps | nonempty TimeStep array | Unique step IDs, strictly increasing timestamps |
| TimeStep.step | ID | General normalized contract supports arbitrary stable steps; demo screen requests accept only `t0`, `t1`, `t2` |
| TimeStep.timestamp | aware ISO 8601 datetime | Explicit UTC `Z` or offset; compare absolute instants |
| FloodObservation.edge_id / timestamp | ID / aware datetime | Edge must join the referenced network; timestamp denotes valid observation/simulation time |
| FloodObservation.depth_m | nonnegative number or null | Water depth in metres; null unavailable |
| FloodObservation.velocity_u_mps / velocity_v_mps | signed numbers or null | Metres/second; signed east/north components after CRS/vector normalization. Demo has no velocity values |
| FloodObservation.provenance | provenance enum | Required per sample |
| RiskAssessment.edge_id | ID | Required network edge reference |
| RiskAssessment.risk_index | nonnegative number or null | Dimensionless; meaning requires supplied versioned parameters. No official numerical thresholds |
| RiskAssessment.parameter_version | ID | Required; `not-integrated` identifies absent research parameters in demo |
| RiskAssessment.provenance | provenance enum | Required |
| RiskAssessment.status | `experimental` or `unavailable` | Experimental requires a value; unavailable requires null. Neither indicates validated safety |

The provider must validate cross-document edge/network/scenario references. Physical samples and risk values remain null in the synthetic fixtures. The authored affected-edge list indicates a software cost change, not a depth threshold. Missing costs fail closed; there is no zero-cost or zero-risk fallback.

Frames are fixed snapshots, not a time-dependent traversal algorithm. Every route edge uses the explicitly requested snapshot, regardless of travel duration. Fictional demo dates do not indicate issue time, freshness, or current monitoring. Before observed/model-predicted integration, extend the contract with issue time, freshness/quality, uncertainty, validity horizon, model version and source manifests as required by SCIENTIFIC-MODULES.md. Never label stale or absent measurements as current.

## Route and screening

| RouteResult field | Type | Meaning |
| --- | --- | --- |
| status / mode | enums | `found` or `unreachable`; `shortest_distance` or `demo_weighted` |
| node_ids / edge_ids | ordered ID arrays | Traversal order; found route has one more node than edges |
| total_length_m | nonnegative number or null | Sum of selected lengths; null for unreachable |
| total_weighted_cost | nonnegative number or null | Sum of selected mode costs; unit supplied in calculation metadata |
| network_id / scenario_id / step | IDs | Exact immutable network, scenario, requested snapshot |
| provenance | provenance enum | Demo is always simulated |
| calculation | CalculationMetadata | algorithm, engine_version, weighting_version, cost_unit (`m` or `demo_cost_units`), warnings array |

Unreachable routes have empty paths and null totals. The engine supports origin = destination as a zero-edge, zero-cost route; the three-stop demo screening contract requires distinct origin, pickup, destination to prevent accidental duplicate selections. Each found route must be reconstructed from valid traversable edges; the service supplies those graph invariants in addition to structural model validation.

`ScreenRequest`: required `origin`, `pickup`, `destination`, `scenario_id` IDs and `step` enum. `ScreenResponse`: required request echo, network_id, frame, warnings, `origin_to_pickup` and `pickup_to_destination`. Each leg contains `baseline` and `demonstration_weighted` RouteResults. Baseline minimizes length with cost in metres. Weighted mode minimizes authored fixture costs in arbitrary demo units; these two numeric cost scales are not scientifically comparable.

Every demo response includes `experimental: true`, `provenance: simulated`, and the exact label **SIMULATED DATA — NOT REAL-TIME FLOOD MONITORING**. Manifest provides dataset ID/version, origin, limitations, default trip. Network response wraps `network`; scenario response wraps `scenarios`. Frame response includes network/scenario IDs, TimeStep, weighting_version, complete edge_costs dictionary, affected_edge_ids, observations, risk_assessments and warning. Zod validates the response envelope and matching route/frame/request references before display.

## File adapter boundary

`NetworkAdapter.normalize(payload, source_crs, attribute_map) -> RoadNetwork` in `app/services/boundaries.py` is a protocol, not an importer. GraphML attribute names, parallel-edge keys, node coordinate fields, length units, boolean encodings and CRS vary by source. GeoJSON may contain lines without graph topology or direction. An adapter must explicitly map attributes, identify licenses/source versions, transform coordinates, normalize units, assign stable IDs, resolve connectivity and direction, and validate the result. Reject ambiguous CRS, nonpositive/missing lengths and unresolved references. No generic automatic GraphML/GeoJSON interpretation is implemented.

Replace `ScenarioProvider` and `WeightingProvider` through the API's dependency factory after normalization. Keep source version → normalized node/edge ID mappings so observations and evidence continue to refer to the exact road edge.

## Claims boundary (unavailable)

`ClaimRequest` requires trip_id, network_id, scenario_id, step, occurred_at (aware datetime), ordered nonempty route_edge_ids, nonempty evidence references, parameter_version and consent_reference. Each evidence reference contains evidence_id, edge_id, captured_at, provenance, source_dataset_id, source_version and a lowercase 64-character SHA-256 digest. It references an immutable source artifact, not a mutable URL or an unverified flood assertion.

`ClaimResponse` currently specifies `status: unavailable`, a reason and `token: null`. No claim endpoint, storage or issuer exists. The future issuer must persist a trip snapshot and evidence record with immutable network/scenario/step/version references, authorize ownership and consent, validate evidence association and chain of custody, and distinguish simulated evidence from observations. The existing database UUID entities will need an explicit mapping to these normalized source IDs; do not silently replace their primary keys.

`ClaimIssuer` and `EvidenceSigner` protocols isolate the future server-only HMAC boundary. Before adding an issued response, define canonical bytes/schema version, evidence digest, claim ID, key ID, algorithm, issuance/expiry, replay prevention and verification/revocation policy. Store keys only in server secret management. A signed internal envelope authenticates origin/integrity; platform recognition and penalty waivers require external agreements and review.
