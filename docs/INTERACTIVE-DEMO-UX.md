# Interactive driver demonstration

> Pembaruan UX (2026-11-06): alur dataset eksperimental kini menjadi satu-satunya pengalaman publik. `/pre-order`, `/navigation`, dan `/claims` dapat dibuka langsung; tidak ada pemilih mode. Sesi versi 1 yang valid tetap dipulihkan meskipun flag lama `enabled` bernilai false. Backend sintetis tetap tersedia untuk regresi internal. Lihat [audit refinement](UX-REFINEMENT-AUDIT.md) untuk perilaku dan screenshot terbaru; uraian implementasi lama di bawah merupakan riwayat.

Delivered 2026-11-06 (Asia/Jakarta) on `feat/interactive-demo-ux`, based on latest fetched main `990806e`. No push, merge, deployment or database migration was performed. Existing untracked `data/`, `scripts/`, dataset audit/plan and local PROMPT input were excluded. Backend code, datasets, routing, session schema, evidence canonicalization and API contracts remain unchanged.

## Access and two-minute walkthrough

Run backend/frontend using [README](../README.md#menjalankan-proyek-secara-lokal). Open `/dashboard` and press **Mulai periksa rute** / **Start route screening**. This explicitly enables the experimental session before opening `/pre-order`; it preserves the user's saved trip. Direct visits retain the saved mode, and new sessions keep the existing synthetic default.

- **Screen:** use N01 → N03 → N12 or change stops and press **Bandingkan rute / Compare routes**. Select either route alternative and inspect a segment by pointer, tap or keyboard Select.
- **Replay:** continue to navigation. Select t1 to see the default weighted path change; select t2–t4 to see its path remain unchanged while source values and cost change. Previous/next and opt-in playback are available. Playback uses two seconds per frame after each response, not historical wall time or vehicle speed.
- **Review:** continue to evidence. Review historical time, route edge references and raw source values. Generate the unsigned preview and export JSON locally. Creation time is separate from historical scenario time. The digest establishes content integrity only.
- **Legacy:** use **Buka demo sintetis lama / Open legacy synthetic demo** on Dashboard or the visible mode selector. The existing A–H graph, three-frame scenario and validation flow remain independent.

## What changed and why

Before, the dashboard sent users to the synthetic demo without explaining experimental mode. A small outline toggle hid the dataset; claims copy described available previews as unavailable. Experimental screens used one undifferentiated column, tiny t0–t4 buttons, static route lines, repeated technical text and a two-stage indicator. Mobile navigation excluded evidence.

The dashboard now explains screening → EWS → evidence and provides a primary dataset entry plus a secondary legacy entry. Screening groups mode, stops, calculation, network and complete two-leg comparisons. The pre-order frame selector is compact; navigation gives the historical timeline prominence. Unsaved edits hide prior routes and continuation until a fresh calculation, preventing old results from being mistaken for edited stops.

The schematic uses API node positions, directed edges and calculated paths. Solid purple and dashed blue distinguish objectives; selected routes are emphasized, changed values have dotted halos, and inspected segments have a thick outline. Reciprocal arcs have separate hit areas. A Radix Select exposes every edge to keyboard/touch users. Unknown data remains unavailable. Raw depth, signed velocity components, weight and weight delta retain their source limitations. No geographic basemap or OSM authentication claim was added.

Timeline labels come from the existing scenario catalog. Frame summaries compare actual backend weighted paths and adjacent-frame costs, including direct jumps and unavailable comparisons. The default path changes at t1 and stays unchanged through t4. This is accurately explained instead of inventing extra reroutes. Playback is explicit, waits for responses, pauses in hidden tabs or after edits/reset, and stops at t4.

Evidence review groups trip, scenario time, route references, source table and export status. It prominently labels unsigned evidence, unverified source data and no platform submission. Existing server recomputation, SHA-256 checks and export behavior are preserved. Three-step navigation and the five-item mobile bar include evidence. Indonesian primary copy and English translations cover all new controls.

## Defensible metrics

- Trip distance sums the returned distances of both found legs, including repeated traversals.
- Objective cost sums both legs of the same objective; distance and weighted objectives have different units and are not presented as percentage improvement or safety scores.
- If either leg is unreachable, complete-trip distance/cost is unavailable.
- Changed segment count is the length of the backend's changed-edge list. Changes can be on or off the selected route and include any sample field, not only weight.
- Cost change subtracts the preceding frame's complete weighted-route objective from the current one. No previous frame, failed comparison or unavailable path produces an unavailable delta.

## Before and after screenshots

Captured from isolated production servers with the real local FastAPI fixture API, at desktop 1440×1000 and mobile 375×1000. Files are full-page captures, so fixed navigation appears within the captured viewport. Evidence creation time naturally differs between captures. Baselines were captured before changing source. Additional 320/375/768/1440px ID/EN and light/dark captures are ignored browser artifacts under `frontend/test-results/`.

| Screen    | Desktop before                                                       | Desktop after                                                      | Mobile before                                                       | Mobile after                                                      |
| --------- | -------------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Dashboard | [Before](screenshots/interactive-demo/before/desktop-dashboard.png)  | [After](screenshots/interactive-demo/after/desktop-dashboard.png)  | [Before](screenshots/interactive-demo/before/mobile-dashboard.png)  | [After](screenshots/interactive-demo/after/mobile-dashboard.png)  |
| Screening | [Before](screenshots/interactive-demo/before/desktop-screening.png)  | [After](screenshots/interactive-demo/after/desktop-screening.png)  | [Before](screenshots/interactive-demo/before/mobile-screening.png)  | [After](screenshots/interactive-demo/after/mobile-screening.png)  |
| EWS       | [Before](screenshots/interactive-demo/before/desktop-navigation.png) | [After](screenshots/interactive-demo/after/desktop-navigation.png) | [Before](screenshots/interactive-demo/before/mobile-navigation.png) | [After](screenshots/interactive-demo/after/mobile-navigation.png) |
| Evidence  | [Before](screenshots/interactive-demo/before/desktop-evidence.png)   | [After](screenshots/interactive-demo/after/desktop-evidence.png)   | [Before](screenshots/interactive-demo/before/mobile-evidence.png)   | [After](screenshots/interactive-demo/after/mobile-evidence.png)   |

Reproduce retained after captures with `UX_CAPTURE=after pnpm test:e2e tests/ux-capture.spec.ts` after `pnpm build:e2e`. Normal test runs write captures only to ignored test output.

## Validation

Final results: **87 backend tests passed; 119 production browser tests passed with 3 existing viewport-specific skips**. Typecheck, ESLint, Prettier (including catalogs), Ruff lint/format, the required production build and `build:e2e` passed. Exact commands and results are recorded in [VALIDATION.md](VALIDATION.md). Existing tests were retained; copy-dependent assertions were updated for the new calculation label and three-step/legacy entry. New cases exercise dashboard discovery, real route layers and inspection, all five frames, changed/unchanged paths, objective deltas, playback, draft edits, previous-frame errors, mobile evidence access and responsive ID/EN themes. Existing session/reload, corruption handling, unsigned export and synthetic/weather/sidebar regressions remain active.

The first network inspection test exposed reciprocal-edge hit-area overlap; separating arcs fixed it, and desktop/mobile reruns passed. Initial sandboxed build/test execution could not start build workers or bind local servers; successful validation used the permissioned host environment. No dependencies were added.

## Remaining limitations

Source ownership/license, geographic CRS, roads, physical units/orientation and calibration are unverified. The schematic is not authenticated geography. No live monitoring, flood prediction, safety threshold, ETA, trained DeepONet output or measured driver benefit is claimed. Lower experimental cost does not establish safety. Driver research and usability testing are still needed.

Trip selections are per tab; blocked storage falls back to memory and cannot recover across reload. API results and generated packages are not persisted. Evidence requires FastAPI and browser Web Crypto; there are no signatures, tokens, verified incidents, platform submissions or penalty approvals. No live database, physical phone, Safari/Firefox, Python 3.12 deployment runtime or hosting environment was tested. External weather remains mocked in browser tests and independent of routing.

## Commits and file inventory

| Commit    | Validated stage                                                    |
| --------- | ------------------------------------------------------------------ |
| `f120887` | Dashboard discovery and three-stage explanation                    |
| `9b920b7` | Screening layout and complete-trip comparisons                     |
| `f552b41` | Interactive network, patterns, inspection and hit areas            |
| `bc96dac` | Historical timeline, actual differences and playback               |
| `2c4edc1` | Three-stage journey, mobile evidence link and evidence review      |
| `0619940` | Final refinements, responsive checks, regression and capture tests |

The documentation commit contains this report, the updated walkthrough/architecture/validation records and retained screenshots. No unrelated files or raw inputs are included.

Frontend files:

- `frontend/messages/en.json`
- `frontend/messages/id.json`
- `frontend/src/app/(dashboard)/dashboard/page.tsx`
- `frontend/src/app/globals.css`
- `frontend/src/components/experimental/demo-entry.tsx` (new)
- `frontend/src/components/experimental/evidence-preview.tsx`
- `frontend/src/components/experimental/journey.tsx` (new)
- `frontend/src/components/experimental/network.tsx` (new)
- `frontend/src/components/experimental/route-comparison.tsx` (new)
- `frontend/src/components/experimental/timeline.tsx` (new)
- `frontend/src/components/experimental/workspace.tsx`
- `frontend/src/components/layout/app-shell.tsx`
- `frontend/src/lib/api/experimental.ts`
- `frontend/tests/experimental-journey.spec.ts`
- `frontend/tests/experimental.spec.ts`
- `frontend/tests/interactive-demo.spec.ts` (new)
- `frontend/tests/interactive-responsive.spec.ts` (new)
- `frontend/tests/journey.spec.ts`
- `frontend/tests/ux-capture.spec.ts` (new)

Documentation files:

- `README.md`
- `docs/ARCHITECTURE.md`
- `docs/EXPERIMENTAL-DATASET-INTEGRATION.md`
- `docs/INTERACTIVE-DEMO-UX.md` (new)
- `docs/ROADMAP.md`
- `docs/USER-GUIDE.md`
- `docs/VALIDATION.md`

Screenshot artifacts (new, 16 files):

- `docs/screenshots/interactive-demo/before/desktop-dashboard.png`
- `docs/screenshots/interactive-demo/before/desktop-screening.png`
- `docs/screenshots/interactive-demo/before/desktop-navigation.png`
- `docs/screenshots/interactive-demo/before/desktop-evidence.png`
- `docs/screenshots/interactive-demo/before/mobile-dashboard.png`
- `docs/screenshots/interactive-demo/before/mobile-screening.png`
- `docs/screenshots/interactive-demo/before/mobile-navigation.png`
- `docs/screenshots/interactive-demo/before/mobile-evidence.png`
- `docs/screenshots/interactive-demo/after/desktop-dashboard.png`
- `docs/screenshots/interactive-demo/after/desktop-screening.png`
- `docs/screenshots/interactive-demo/after/desktop-navigation.png`
- `docs/screenshots/interactive-demo/after/desktop-evidence.png`
- `docs/screenshots/interactive-demo/after/mobile-dashboard.png`
- `docs/screenshots/interactive-demo/after/mobile-screening.png`
- `docs/screenshots/interactive-demo/after/mobile-navigation.png`
- `docs/screenshots/interactive-demo/after/mobile-evidence.png`
