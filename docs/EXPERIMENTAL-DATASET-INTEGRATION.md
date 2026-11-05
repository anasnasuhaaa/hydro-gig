# Experimental small-network fixture replay

This is a software research fixture, not a production flood warning or verified Bogor road layer. Source provenance remains **unknown**. Application replay is **simulated/unverified** and routes are **experimental computations**. These three facts are carried separately in every response. Global RoadNetwork and demo provenance contracts are unchanged.

Current interface and screenshots: [INTERACTIVE-DEMO-UX.md](INTERACTIVE-DEMO-UX.md). Start with **Explore Flood Scenario Simulation** on Dashboard; direct screen visits retain the existing saved-mode behavior.

## Inputs and immutable identity

Canonical inputs under `data/raw/` (read only):

| File                                    | SHA-256                                                            |
| --------------------------------------- | ------------------------------------------------------------------ |
| `02_road_network_nodes.csv`             | `cd8b97897304414a03063091c9041cacbb9076c5f55df0fd9b67890e0ac5b701` |
| `02_road_network_edges.csv`             | `9d3e8425858df191cfd1bd5d30f770d811cc8bba0109d116e0ef2d6cceefb32f` |
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

All five t0–t4 frames are retained. Comparisons use the immediately preceding source frame, even when a user skips a step. Changed edges mean any stored sample value changed; weight deltas show exact numeric changes. Fixed-frame routes do not predict conditions at arrival times. The backend evaluates only the requested historical frame. Optional client playback advances selection every two seconds after each response; this is a presentation speed, not a live stream, forecast or simulated driver speed.

Both `/pre-order` and `/navigation` offer an explicit dataset button; synthetic mode remains default. React Hook Form/Zod validate selections, shadcn/Radix provide selectors, TanStack Query and the existing typed fetch client handle cancellable requests and Zod response validation. Query keys include nodes/scenario/frame. Errors suppress stale results. Node IDs, paths and numeric source fields remain stable; all explanatory UI text is bilingual and valid times display in Asia/Jakarta. Route-change text compares backend weighted edge sequences for identical trip selections across adjacent frames. The table provides raw values and changes; route cards explain unreachable directed trips. Experimental selections now persist across pre-order, navigation and claims using the isolated validated session described below.

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

Recommended next step: obtain the source/license/CRS and generation manifests, then independently validate road topology and physical units before considering geographic or scientific promotion. The experimental trip session now preserves selections across screens without mixing demo IDs.

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

## Complete three-stage journey

1. Open `/pre-order`, choose **Use experimental dataset**, select the sample stops and press **Compare routes**. The default trip is N01 → N03 → N12. Review distance and stored-weight alternatives.
2. Press **Continue to navigation**. The selected trip and frame are retained. Choose t0 through t4 and review actual backend path/cost changes. Press **Continue to evidence preview**.
3. On `/claims`, review the selected trip, historical valid time, weighted route segments, raw source values and changes from the preceding frame. Press **Generate evidence preview**, then **Export preview JSON**. The package is downloaded locally and is not submitted to any platform.
4. Reload any screen to recover selections. **Reset demonstration** restores the default experimental trip at t0 and clears saved route references and the displayed evidence preview. **Return to synthetic demo** selects the independent existing synthetic experience.

### Session contract

`frontend/src/components/experimental/session.ts` stores only schema/dataset/network versions, mode, selected request (origin/pickup/destination/scenario/frame) and route edge references under `hydrogig-experimental-v1`. The synthetic `hydrogig-demo-v1` entry is independent. Strict Zod validation checks version literals, fixture node IDs and frame IDs. Malformed/obsolete selections fall back with an explicit message. State uses `useSyncExternalStore` for cross-page updates and hydration. Blocked storage retains state in browser memory during client navigation; a full reload with blocked storage necessarily starts fresh. No GPS histories, identities, secrets, telemetry, API results or generated packages are stored.

Saved route references are hints only, not trusted evidence inputs. Changing the trip/frame clears them. Continuing records the current weighted edge IDs. Both navigation and claims fetch routes for the selected request again; evidence generation recomputes everything server-side. Reset clears references. A new fixture identity requires a new session version/schema.

### Evidence API and canonicalization

`POST /api/v1/experimental/evidence/preview` accepts the existing strict experimental ScreenRequest. The service recalculates both objectives and legs and selects their union of edge references and source samples. `affected_route_edge_ids` is the intersection with the preceding-frame changes, not an incident/safety classification. The full calculation retains status, ordered paths, dataset/network versions, scenario/frame/time, algorithm and weighting metadata, provenance and limitations. A dedicated `scenario_version: "1"` and schema `experimental-evidence-v1` identify this package format.

The response contains `created_at` (server UTC package creation), `content`, `canonical_content`, `sha256`, `canonicalization` and `digest_scope`. Scenario valid time stays in `content.calculation.frame.timestamp`; it is never replaced with creation time.

Canonicalization `python-json-sorted-utf8-v1` is explicitly Python's JSON serialization of normalized Pydantic JSON data with sorted object keys, compact separators, Unicode retained and nonfinite values forbidden. Array order is preserved. This is a versioned application encoding, not a claim of RFC 8785 compliance. SHA-256 hashes the exact UTF-8 `canonical_content` bytes. The digest excludes `created_at`; repeated previews of identical content have identical hashes with separate creation timestamps. Verify exported integrity by hashing that exact included string. The browser validates the schema, verifies the digest, checks canonical/content equivalence and matches the requested trip before enabling export. Web Crypto availability is required; failure produces an unavailable state.

`token` and `signature` are always null, `submission_status` is always `not_submitted`. Client-provided tokens, arbitrary observations, route arrays and author/time claims are rejected as extra request fields. No package is signed, persisted server-side or sent to an ojol platform. A digest does not authenticate the author, prove an incident, establish legal validity, confer penalty exemption or guarantee safety. T_EXO issuance and platform acceptance remain unimplemented future work.

### New implementation files

- `frontend/src/components/experimental/session.ts`: validated isolated selection storage and memory fallback.
- `frontend/src/components/experimental/evidence-preview.tsx`: selected-trip review, generation and local export.
- `backend/app/services/evidence.py`: evidence contracts, recomputation and canonical digest.
- `backend/tests/test_evidence.py` and `frontend/tests/experimental-journey.spec.ts`: canonicalization/reference and journey checks.

Updated the experimental workspace/API client, experimental controller, claims page and both translation catalogs. Existing synthetic claims presentation remains the fallback when experimental mode is not selected.

### MIT Solve demonstration walkthrough (about two minutes)

- **0:00–0:20:** Explain the problem being explored: helping motorcycle delivery drivers review route disruption and document the context. State that this is an experimental software MVP using simulated/unverified data.
- **0:20–0:45:** On pre-order, enable the dataset and calculate the default N01 → N03 → N12 trip. Explain that FastAPI calculates both alternatives dynamically; distance and experimental objective are separate.
- **0:45–1:15:** Continue to navigation. Select t1: the weighted second leg changes from N03→N04→N05→N12 to N03→N06→N07→N12. Select t2–t4: the same path can persist while costs change. This is manual historical replay, not forecasting.
- **1:15–1:45:** Continue to claims. Review the selected frame, raw route values and provenance. Generate and export the preview. Point out historical valid time versus package creation time and explain that SHA-256 identifies content integrity only.
- **1:45–2:00:** Show “Not Submitted to Any Platform.” State the next research gates: traceable licensed roads, validated physical generation/calibration, consented telemetry and a real platform agreement. Do not present unmeasured safety benefits, model accuracy, compensation or platform approval.

Reproduce with the existing backend/frontend startup commands and the production testing commands above. No database or external weather provider is required for this journey.

### Three-stage journey validation results (2026-11-05)

- Backend `pytest -q`: **87 passed**; one existing Starlette/httpx deprecation warning. Ruff check passed and Ruff formatting check reported 44 files formatted.
- Frontend typecheck, lint and Prettier checks passed. Production `pnpm build` with isolated `.next-e2e` output and API port 8100 passed; `pnpm build:e2e` passed before browser tests.
- Initial session/fixture browser validation: **12 passed** on desktop/mobile.
- Full production Playwright suite after evidence integration: **99 passed, 3 existing device-specific skips**, including synthetic regression and the complete export journey on desktop/mobile.
- Backend tests verify stable canonicalization across object-key ordering, deterministic content hashes despite different creation times, selected request/frame references, exact route sample joins, provenance, null tokens/signatures, and rejection of forged extra fields/unknown IDs/frames.
- Journey tests verify custom pickup transfer across all three screens, t0–t4 selections, reload recovery, memory fallback, invalid/stale selections, reset, local download parsing and independent SHA-256 verification.

No database, platform submission, signing system, scientific calibration, physical device or deployment was exercised. Evidence generation requires the backend; digest verification requires browser Web Crypto. Packages are downloaded by explicit user action and never auto-submitted.

After adding the digest-corruption rejection case, `pnpm typecheck` and `pnpm lint` passed again; the focused final `pnpm test:e2e tests/experimental-journey.spec.ts` run passed **all 10 desktop/mobile cases**, using the same production build (only test code changed). Corrupt digest responses cannot enable JSON export. `git diff --check` passed before the final commits.
