# Development roadmap

## Current interactive research demo (2026-11-06)

Implemented: explicit experimental dashboard entry, three-stage journey, selectable route layers, segment inspection, five historical frames with optional display playback, API-derived change/cost summaries, persisted trip selections, and unsigned evidence review/export. See [INTERACTIVE-DEMO-UX.md](INTERACTIVE-DEMO-UX.md). Earlier phase records below describe historical milestones. Scientific calibration, authenticated evidence/signing, platform acceptance, licensed geography, database integration and deployment remain future work.

## Phase 1 — Foundation and UI Design System

Independently deployable Next.js and FastAPI apps, accessible library-based UI, honest connectivity, preliminary PostGIS models/migrations, tests, and documentation. Scientific workflows remain unavailable. Live migration verification requires a configured development database.

## Phase 1.5 — UI Refinement and Dataset-Independent MVP Preparation

Implemented: official shadcn sidebar with a header trigger and icon collapse; Pydantic/Zod contracts; an isolated, deterministic eight-node synthetic graph; replaceable normalization/provider/weighting/routing interfaces; heap Dijkstra; versioned experimental API; interactive pre-order form; user-driven t0/t1/t2 EWS schematic; claim envelope/signing boundaries; backend/browser tests and integration documentation. No database or external dataset is required for the demonstration.

## Phase 1.6 — UI, localization, guide and weather context

Implemented: transparent official sidebar trigger, climate-blue light/dark tokens, mobile bottom navigation, server-rendered Indonesian/English with persistent cookie and stable routes, optional single-fix GPS and manual Bogor selection, bounded Open-Meteo weather provider/API, visual three-step Guide, compact diagnostics and redesigned functional screens. Weather conditions are model-derived and independent of synthetic flood scenarios. See [USER-GUIDE.md](USER-GUIDE.md) and [WEATHER.md](WEATHER.md).

Browser testing uses an isolated production build and separate 3100/8100 ports to coexist with development. Authentication, scientific validation, real geographic navigation, evidence signing and deployment remain future work.

## Phase 1.7 — Driver-first guided demo

Implemented: Dashboard entry point, two-step driver progress, manifest-backed example, optional location/simulation controls, shortest/alternative route comparison, friendly fixed-snapshot timeline, API-derived cost/path differences, Previous/Next/Reset, validated per-tab selection recovery, bilingual four-step guide/glossary and contextual help. Backend API IDs, scientific contracts, graph and heap Dijkstra remain unchanged. Claims is a future preview, never a completed driver step.

### Dataset-independent priorities

| Priority | Work                                                                       | Status / dependency                                                                                                                                     |
| -------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P0       | Guided example and clear driver flow                                       | Implemented in 1.7; driver usability review still needed                                                                                                |
| P0       | Synthetic timeline and transparent limitations                             | Implemented; fixed fictional snapshots, unknown flood risk                                                                                              |
| P0       | Robust errors and automated end-to-end checks                              | Implemented; retain regressions and test new providers                                                                                                  |
| P0       | Driver instructions and explicit demo limits                               | Bilingual Guide and docs available; live hydrology/Claims unavailable                                                                                   |
| P1       | Bilingual UI and persistent preferences                                    | Existing ID/EN cookie, theme and sidebar preferences retained                                                                                           |
| P1       | Explicit single-fix device location and manual fallback                    | Existing weather-only integration; never route schematic nodes from GPS without an adapter                                                              |
| P1       | Real weather context via FastAPI                                           | Existing Open-Meteo model context with timestamps, timeout/client cache and fallback; shared caching/quota hardening remains; independent of flood risk |
| P1       | Schematic annotations, comparisons and accessibility                       | Existing route styles, labels, keyboard controls; continue driver review                                                                                |
| P1       | Data import readiness                                                      | Plan source-specific GraphML/GeoJSON normalization, CRS/edge-ID/units checks and fixture integration tests; no production importer yet                  |
| P1       | Consent-free synthetic evidence envelope and server verification prototype | Separate future phase; no personal data, real tokens or platform acceptance claims                                                                      |
| P2       | Real road import and licensed geographic map                               | Requires licensed geometry, source manifest and tile attribution                                                                                        |
| P2       | Scientifically parameterized risk and Modified Dijkstra                    | Requires research-team Python modules, parameter provenance and validated reference cases                                                               |
| P2       | Observation quality, provenance and uncertainty checks                     | Requires traceable observations, freshness/validity policy and independent validation                                                                   |
| P2       | Neon/PostGIS migration and deployment validation                           | Requires supplied disposable infrastructure and explicit deployment authorization                                                                       |
| P2       | Authentication/RBAC for drivers, Claims, admins/researchers                | Requires identity/privacy/product requirements before real records                                                                                      |
| P2       | Real GNSS crowdsensing and validated hydrodynamic predictions              | Requires consent, calibration, real datasets and scientific validation                                                                                  |

Future datasets join through `NetworkAdapter` / `ScenarioProvider`; the team's Python risk and Modified Dijkstra modules plug into `WeightingProvider` / `RoutingEngine`. Normalize CRS, units and stable edge IDs, retain source/parameter versions, handle missing values explicitly and test against research reference cases. Keep observed/model-predicted providers and endpoints distinct from synthetic `/demo`; do not infer safety from route cost or weather. See [DEMO-SIMULATION.md](DEMO-SIMULATION.md) and [SCIENTIFIC-MODULES.md](SCIENTIFIC-MODULES.md).

### Remaining before a dataset-backed MVP

- Obtain licensed road data and normalize source-specific GraphML/GeoJSON fields, CRS, topology, units and stable edge IDs.
- Receive and validate the team's risk parameters/Python module, Modified Dijkstra and scenario frames against trusted reference cases; integrate through service protocols.
- Agree on risk missing/stale-data policy, temporal validity, uncertainty and explicit experimental warning interpretation.
- Finalize evidence/token fields and authorization, consent, persistence, HMAC canonicalization, key management and verification. Claims remain unavailable until these are implemented.
- Provide optional Neon/PostGIS infrastructure for a disposable migration verification; review Vercel configuration and run deployment checks only when deployment is authorized.
- Perform research-team and driver-workflow review, retain simulation labels and document all remaining scientific limitations.

The Phase 1.5 EWS is a schematic interaction demo. Later phases still require real geographic data and scientific validation.

## Phase 2 — Mathematical Risk Engine and Routing

Implement tested mathematics after obtaining defensible parameter sources. Establish road-network provenance, coordinate conventions, graph quality, missing-data semantics, and uncertainty. Keep experimental risk thresholds explicit/versioned; validate independently before driver recommendations.

## Phase 3 — EWS Simulation and Navigation

Add MapLibre with a licensed tile provider, explicitly simulated scenarios, route/warning interactions, and time/freshness controls. Label simulations on maps, charts, notifications, and exports. Experimental warnings must not imply live monitoring.

## Phase 4 — Digital Evidence and Claims

Define canonical records, signing/verification, key rotation/storage, revocation, timestamps, exports, and consent. Add authorization/privacy before identifiable telemetry or incidents. Platform recognition requires separate agreement; tokens do not guarantee penalty reversal.

## Phase 5 — Crowdsensing and Scientific Model Integration

Collect consented IMU/GNSS with quality flags, calibrate spatiotemporal processing, and integrate validated hydrodynamic providers. Evaluate a Physics-Informed DeepONet only when real datasets/checkpoints exist. Document dataset splits, out-of-distribution behavior, uncertainty, and limits. Gate safety claims on validation and field review.
