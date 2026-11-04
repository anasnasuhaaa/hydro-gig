# Phase 1.5 deterministic demonstration

**SIMULATED DATA — NOT REAL-TIME FLOOD MONITORING**

This demonstrates application interaction only. It contains no real Bogor road measurements, flood observations, hydrodynamic parameters, validated risk values, model predictions or safety recommendations. Demo fixtures never seed production tables.

## Run

Follow README setup. Start FastAPI from `backend/` with `.venv/bin/uvicorn app.main:app --reload --port 8000`; start Next.js from `frontend/` with `pnpm dev`. PostgreSQL credentials can remain empty. Open `/pre-order`, choose A (origin), C (pickup), F (destination), a scenario/frame, and click **Screen Route**. After a successful API response, open its EWS simulation link. `/navigation` also offers the manifest's default trip without screening first. Use t0/t1/t2 or **Advance simulation**; there are no timers, position tracking or background streams. `/claims` deliberately keeps issuance disabled.

Trip and frame selection live in the shared dashboard layout's memory, survive client navigation between the two workspaces, and reset on a full browser reload. No trip or evidence is persisted. Form edits hide previous results until resubmission. Navigation requests are keyed by the entire trip/scenario/frame; old routes are hidden during loading or failure.

## Fixture manifest and graph

`backend/demo/fixtures.json` contains a metadata manifest, normalized network, scenario and all three frames. It is included as Python package data; the provider reads a fresh validated object per call. Values and fictional timestamps are fixed. The provider needs no database, external services, random generator or mutable user simulation state.

Dataset `hydrogig-synthetic-v1`, network `synthetic-network-v1`, scenario `synthetic-corridors-v1`, fixture version `1.0.0`, weighting `authored-costs-v1`.

| Edge | Directed traversal | Authored length (synthetic m) |
| --- | --- | --- |
| AB | A → B | 100 |
| BC | B → C | 100 |
| CD | C → D | 100 |
| DF | D → F | 100 |
| AG | A → G | 140 |
| GC | G → C | 140 |
| CE | C → E | 160 |
| EF | E → F | 160 |
| FH | F → H | 100 |

All eight nodes belong to one weakly connected graph. H is a directed sink: it cannot originate a return journey. Nodes have unitless `LOCAL:SCHEMATIC` drawing positions; coordinates do not determine the authored lengths. The isolated SVG schematic uses directional arrows, route styling, segment labels and text warnings. MapLibre remains available separately but unmounted until licensed styles and geographic geometry exist.

| Frame | Fictional valid time (UTC) | Changed authored costs | A → C weighted edges | C → F weighted edges |
| --- | --- | --- | --- | --- |
| t0 | 2026-01-01 00:00 | None | AB, BC (200 units; 200 m) | CD, DF (200 units; 200 m) |
| t1 | 2026-01-01 00:05 | BC = 900; CD = 900 | AG, GC (280 units; 280 m) | CE, EF (320 units; 320 m) |
| t2 | 2026-01-01 00:10 | DF = 900; BC/CD reset | AB, BC (200 units; 200 m) | CE, EF (320 units; 320 m) |

Unchanged demo costs numerically equal synthetic lengths by fixture authorship only. These arbitrary units do not implement the research risk formula. The distance baseline stays AB/BC then CD/DF in all frames. At t0, no authored changes does **not** mean dry conditions or safe roads. Every edge's depth, velocity and risk are null/unavailable in every frame.

## Experimental API

All endpoints are under `/api/v1/demo`, are tagged experimental in OpenAPI, include the simulation envelope, and are independent of database settings.

| Method / path | Response |
| --- | --- |
| GET `/manifest` | Dataset identity/version, origin, limitations, default trip |
| GET `/scenarios` | Scenario list and ordered timestamped frames |
| GET `/network` | Normalized nodes, directed segments, CRS and provenance |
| GET `/scenarios/{scenario_id}/frames/{step}` | Explicit snapshot, authored costs and affected segments; missing physical values |
| POST `/screen` | Both trip legs, each with baseline and weighted route |

Example:

```bash
curl http://localhost:8000/api/v1/demo/manifest
curl http://localhost:8000/api/v1/demo/scenarios/synthetic-corridors-v1/frames/t1
curl -X POST http://localhost:8000/api/v1/demo/screen \
  -H 'Content-Type: application/json' \
  -d '{"origin":"A","pickup":"C","destination":"F","scenario_id":"synthetic-corridors-v1","step":"t1"}'
```

Representative fragment of the actual screen response (remaining envelope, frame, warnings, baseline and second-leg fields omitted here):

```json
{
  "experimental": true,
  "provenance": "simulated",
  "label": "SIMULATED DATA — NOT REAL-TIME FLOOD MONITORING",
  "origin_to_pickup": {
    "demonstration_weighted": {
      "status": "found",
      "mode": "demo_weighted",
      "node_ids": ["A", "G", "C"],
      "edge_ids": ["AG", "GC"],
      "total_length_m": 280.0,
      "total_weighted_cost": 280.0,
      "network_id": "synthetic-network-v1",
      "scenario_id": "synthetic-corridors-v1",
      "step": "t1",
      "provenance": "simulated",
      "calculation": {
        "algorithm": "heap-dijkstra",
        "engine_version": "demo-dijkstra-v1",
        "weighting_version": "authored-costs-v1",
        "cost_unit": "demo_cost_units",
        "warnings": [
          "SIMULATED DATA — NOT REAL-TIME FLOOD MONITORING",
          "Fixed-frame calculation; no travel-time forecast or safety guarantee."
        ]
      }
    }
  }
}
```

Unknown nodes, duplicate trip stops, missing/extra fields and invalid screen steps return 422. Unknown scenario/frame lookup returns 404. Unreachable directed journeys return 200 with per-leg `status: unreachable`, empty IDs and null totals, so a reachable second leg is still inspectable. Physical unknowns are never filled with zeros. OpenAPI provides complete request/response definitions.

## Replace the demo foundation

1. Implement `NetworkAdapter` for a specific GraphML/GeoJSON source and explicit attribute/CRS/unit mapping. Verify license, connectivity, parallel-edge identity and direction. Return a validated RoadNetwork, preserving source-ID mapping. There is no production importer in this phase.
2. Implement a provider for versioned scenarios/frames with traceable timestamps and provenance. Retain the synthetic provider and tests as a separate demonstration path; add separate observed/model-predicted endpoints and labels rather than disguising real data behind `/demo`.
3. Implement `WeightingProvider.costs` around the research team's Python risk module. Require empirical parameter sources/version, units, missing-data policy, temporal semantics, uncertainty and finite nonnegative costs. Missing values must not default to zero. Physical risk output stays separate from routing costs.
4. Implement `RoutingEngine.route` around the team's Modified Dijkstra module, translating its output to ordered IDs, lengths, cost, status and calculation metadata. The HTTP controller remains unchanged for the demo path; inject through `demo_service` or FastAPI dependency overrides for integration tests. Do not call an external Python module directly from the controller.
5. Test trusted reference graphs, directed/unreachable cases, temporal changes, CRS/ID joins and scientific reference cases before exposing real recommendations. Replace SVG with a GeoJSON-powered MapLibre layer only after geographic/attribution checks.

The temporary heap-based Dijkstra supports nonnegative costs (including zero), parallel edges, directed/two-way traversal, deterministic tie behavior, reconstruction and unreachable routes. Missing, negative or nonfinite costs fail closed. It makes one fixed-frame calculation for each leg/mode, not a time-dependent travel forecast. There is no calibrated risk engine, live navigation, real positioning, trained model, HMAC token issuer, claim persistence or platform penalty integration.

## Before the November 6 MVP

Obtain and normalize the team's licensed road graph and t0/t1/t2 scenario data; agree on CRS, edge mapping and timestamp semantics. Integrate versioned risk parameters and Modified Dijkstra through the existing boundaries, validate against research reference cases, and assess missing/stale-data behavior. Agree on evidence/token specifications, consent, persistence, canonicalization, signing/verification and key management before implementing claims. Validate Neon migrations in disposable infrastructure when provided; prepare and review Vercel configuration without automatic deployment. Complete a research-team walkthrough and clearly retain experimental provenance/limitations in the MVP.
