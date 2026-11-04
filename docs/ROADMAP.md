# Development roadmap

## Phase 1 — Foundation and UI Design System

Independently deployable Next.js and FastAPI apps, accessible library-based UI, honest connectivity, preliminary PostGIS models/migrations, tests, and documentation. Scientific workflows remain unavailable. Live migration verification requires a configured development database.

## Phase 1.5 — UI Refinement and Dataset-Independent MVP Preparation

Implemented: official shadcn sidebar with a header trigger and icon collapse; Pydantic/Zod contracts; an isolated, deterministic eight-node synthetic graph; replaceable normalization/provider/weighting/routing interfaces; heap Dijkstra; versioned experimental API; interactive pre-order form; user-driven t0/t1/t2 EWS schematic; claim envelope/signing boundaries; backend/browser tests and integration documentation. No database or external dataset is required for the demonstration.

## Phase 1.6 — UI, localization, guide and weather context

Implemented: transparent official sidebar trigger, climate-blue light/dark tokens, mobile bottom navigation, server-rendered Indonesian/English with persistent cookie and stable routes, optional single-fix GPS and manual Bogor selection, bounded Open-Meteo weather provider/API, visual three-step Guide, compact diagnostics and redesigned functional screens. Weather conditions are model-derived and independent of synthetic flood scenarios. See [PHASE-1.6-IMPLEMENTATION.md](PHASE-1.6-IMPLEMENTATION.md) and [WEATHER.md](WEATHER.md).

Browser testing uses an isolated production build and separate 3100/8100 ports to coexist with development. Authentication, scientific validation, real geographic navigation, evidence signing and deployment remain future work.

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
