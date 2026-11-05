# Experimental small-network fixture replay

This is a software research fixture, not a production flood warning or verified Bogor road layer. Source provenance remains **unknown**. Application replay is **simulated/unverified** and routes are **experimental computations**. These three facts are carried separately in every response. Global RoadNetwork and demo provenance contracts are unchanged.

## Inputs and immutable identity

Canonical inputs under `data/raw/` (read only):

| File | SHA-256 |
| --- | --- |
| `02_road_network_nodes.csv` | `cd8b97897304414a03063091c9041cacbb9076c5f55df0fd9b67890e0ac5b701` |
| `02_road_network_edges.csv` | `9d3e8425858df191cfd1bd5d30f770d811cc8bba0109d116e0ef2d6cceefb32f` |
| `04_inundation_scenarios_t0_t1_t2.json` | `bee22c68b038bb9c54a75b92ea90f61344694273ca31b5d6bbd160a1919c3b77` |

The audited CSV/GeoJSON duplicates are not additional independent observations and are not required at runtime. Dataset 06 stored paths are not routing inputs. Datasets 07/08 and the large family are not consumed or promoted. The audit and integration plan existed as local untracked inputs; they were read but are not included in these commits.

Dataset `small-fixture`, version `1`; network `small-directed-v1`, version `1`; scenario `small-inundation-v1`. Original 12 node IDs and 20 edge IDs remain unchanged. Each ONE_WAY row becomes exactly one directed arc; reciprocal rows remain separate. Unknown direction labels are rejected. Lengths must be positive and finite. Endpoint references, unique IDs, all five ordered aware timestamps and all 100 edge/frame joins are validated. Raw nested edge endpoints, length, timestamp and step must agree with their parent network/frame. Missing costs, negative/nonfinite costs and incomplete frames fail validation. Nullable raw physical fields remain null, never zero.

`backend/experimental/normalize.py` creates `backend/experimental/processed/small-v1.json`. Repeating normalization must produce identical bytes; it refuses to overwrite a different artifact at this version. New inputs require a reviewed new version. Runtime loads only this small packaged artifact, validates it once per process and returns deep copies to prevent request mutation. No database, raw-data scanning, network request or startup migration is involved.

## Provenance and coordinate policy

Separate experimental Pydantic/Zod envelopes avoid weakening RoadNetwork. Hashes establish identity, not authenticity, scientific validation or permission to redistribute. Source ownership, license, acquisition, CRS and velocity axes remain unresolved. Packaging is a local software fixture capability; public redistribution requires a source/license review.

The preview linearly scales the source degree-like x/y values into an SVG drawing. It declares no EPSG code and makes no distance measurements from coordinates. It is a schematic coordinate preview, with no basemap, tile requests, OSM coverage claim or geolocation. Lengths remain supplied unverified metre values. The existing MapLibre adapter requires a licensed style and geographic interpretation; neither is appropriate to certify here.

Field provenance describes `h_m` as raw unverified depth assumed metres and `u_ms/v_ms` as raw signed components assumed m/s, with unknown orientation. These are not east/north calibrated velocities. Risk categories, safety verdicts, rainfall, ETA and tokens are deliberately not imported. Unknown metadata is listed in `missing_data`; unavailable sample fields are explicit nulls.

## API

All paths are under `/api/v1/experimental`:

- `GET /network`: metadata, input hashes, nodes, directed edges.
- `GET /scenarios`: metadata, five step/timestamp entries.
- `GET /scenarios/{scenario_id}/frames/{step}`: frame ID (`step`), historical valid timestamp, complete raw sample mapping, previous step, changed edge IDs and signed weight deltas.
- `POST /routes/screen`: origin/pickup/destination/scenario/step request, frame and two route legs, each with baseline and weighted alternatives.

Metadata includes dataset/network IDs and versions, scenario ID, separate provenance statuses, replay status, algorithm/weighting versions, missing metadata and limitations. Network/scenario catalog responses describe the whole replay; they have no selected frame. Unknown node or invalid request: 422; unknown scenario/frame: 404; unavailable/invalid packaged artifact: sanitized 503. Unreachable paths are successful calculations with status `unreachable`, empty paths and null totals, not fabricated alternatives. Origin=destination is a supported zero-edge route.

Example:

```bash
curl http://localhost:8000/api/v1/experimental/routes/screen \
  -H 'Content-Type: application/json' \
  -d '{"origin":"N01","pickup":"N03","destination":"N12","scenario_id":"small-inundation-v1","step":"t4"}'
```

Actual `origin_to_pickup.weighted` response excerpt:

```json
{
  "status": "found",
  "node_ids": ["N01", "N02", "N03"],
  "edge_ids": ["E_01_02", "E_02_03"],
  "distance_m": 1471.17,
  "objective_cost": 11801.783,
  "cost_unit": "experimental_units"
}
```

The baseline for this leg has the same path and distance, with objective `1471.17 m`. Equal paths are legitimate; costs and paths are distinct concepts. For the default trip, the weighted pickup-to-destination path changes from N03→N04→N05→N12 at t0 to N03→N06→N07→N12 at t1. It stays on that path through t4 while stored costs continue to change.

## Calculation and replay

The existing deterministic heap Dijkstra core was extracted and shared with the unchanged demo adapter. Sorted edge IDs and heap node order retain deterministic tie handling. Every request builds adjacency from the processed graph and resolves the selected frame's complete costs. Baseline minimizes stored metre lengths; weighted mode minimizes stored `dijkstra_weight_W` values as arbitrary experimental units. Reported distance sums selected lengths separately. Overflow is rejected. No exponential risk expression is evaluated and finite costs never close edges.

All five t0–t4 frames are retained. Comparisons use the immediately preceding source frame, even when a user skips a step. Changed edges mean any stored sample value changed; weight deltas show exact numeric changes. Fixed-frame routes do not predict conditions at arrival times. No timer, forecast or live stream advances replay.

Both `/pre-order` and `/navigation` offer an explicit dataset button; synthetic mode remains default. React Hook Form/Zod validate selections, shadcn/Radix provide selectors, TanStack Query and the existing typed fetch client handle cancellable requests and Zod response validation. Query keys include nodes/scenario/frame. Errors suppress stale results. Node IDs, paths and numeric source fields remain stable; all explanatory UI text is bilingual and valid times display in Asia/Jakarta. Route-change text compares backend weighted edge sequences for identical trip selections across adjacent frames. The table provides raw values and changes; route cards explain unreachable directed trips. Experimental selections are local to each workspace and reset on remount; cross-page session persistence is not implemented for this mode.

## Reproduction and validation

```bash
cd backend
.venv/bin/python -m experimental.normalize
.venv/bin/pytest -q
.venv/bin/ruff check .
.venv/bin/ruff format --check .
cd ../frontend
pnpm typecheck
pnpm lint
NEXT_DIST_DIR=.next-e2e NEXT_PUBLIC_API_BASE_URL=http://localhost:8100 pnpm build
pnpm build:e2e
pnpm test:e2e
```

Raw inputs are optional for runtime and packaged-fixture tests; the reproduction test skips explicitly if they are absent. Existing local dependencies were used, without installation. Playwright starts production servers on 3100/8100 without DB or server reuse.

Backend tests compare every origin/destination pair, both objectives and five frames against an independent relaxation oracle (1,440 optimal-cost comparisons), verify traversals and sums, changed graph/weights, source reproduction, invalid joins/frames/weights, unavailable artifact, cache isolation, API errors and unchanged demo tests. Browser tests exercise both modes, t4 requests, previews, raw tables, unreachable selections, invalid response rejection and unavailable API behavior on desktop/mobile.

Actual final command results are recorded below after execution.

## Development status and next step

**IMPLEMENTED:** small offline adapter, immutable artifact, isolated validated API, shared dynamic routing, five-frame comparisons, opt-in bilingual interfaces and schematic preview, automated validation.

**SIMULATED:** application scenario replay using unverified source depth, signed components, lengths and weights. Origin of the supplied values is not established as synthetic or observed.

**NOT IMPLEMENTED:** trained DeepONet inference or training, validated SWE generation, live telemetry, realtime flood monitoring, operational flood-safe routing, actual ojol integration, authenticated penalty-exemption tokens, database persistence, large-family regression, verified OSM replacement, deployment.

Recommended next step: obtain the source/license/CRS and generation manifests, then independently validate road topology and physical units before considering geographic or scientific promotion. For software UX, a separately tested experimental trip session could preserve selections across screens without mixing demo IDs.

## Changed-file inventory

Created:

- `backend/experimental/normalize.py`
- `backend/experimental/processed/small-v1.json`
- `backend/app/schemas/experimental.py`
- `backend/app/services/experimental.py`
- `backend/app/api/v1/endpoints/experimental.py`
- `backend/tests/test_experimental.py`
- `frontend/src/lib/api/experimental.ts`
- `frontend/src/components/experimental/workspace.tsx`
- `frontend/tests/experimental.spec.ts`
- `docs/EXPERIMENTAL-DATASET-INTEGRATION.md`

Modified:

- `backend/app/main.py` (router registration)
- `backend/app/services/routing.py` (shared heap core)
- `frontend/src/app/(dashboard)/pre-order/page.tsx`
- `frontend/src/app/(dashboard)/navigation/page.tsx`
- `frontend/messages/en.json`
- `frontend/messages/id.json`

Raw files, PROMPT.md, dependency manifests and database configuration were not modified or staged. No push, PR or deployment was performed.

## Executed results (2026-11-05)

- `pytest -q`: **85 passed**. One existing Starlette/httpx deprecation warning; no dependency change made. Local virtualenv used Python 3.14; a separate Python 3.12 runtime was not exercised.
- `ruff check .`: passed; `ruff format --check .`: 42 files already formatted.
- `pnpm typecheck`, `pnpm lint`: passed.
- Prettier check of source/tests/config: passed.
- Production `pnpm build` with isolated output/API environment: passed.
- `pnpm build:e2e`: passed before the final browser run.
- Full `pnpm test:e2e`: **91 passed, 3 skipped** in desktop/mobile Chromium. Skips are existing device-specific sidebar tests. All six experimental browser cases passed.
- The initial browser run had 86 passes, 3 failures and 3 skips: two ambiguous alert locators and one untranslated timezone label. Both causes were fixed; the final rebuilt full run above passed. Two additional experimental cases were included in that final run.
- `git diff --check`: passed. Canonical input hashes and byte-identical artifact reproduction passed. Raw inputs were not staged.

No live database, real sensors, geographic source verification, physical model validation or deployment was tested.
