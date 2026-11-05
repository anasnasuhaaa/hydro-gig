# Interactive demonstration validation — 2026-11-06

Branch `feat/interactive-demo-ux`, based on main `990806e`. See [delivery report, file inventory and before/after screenshots](INTERACTIVE-DEMO-UX.md).

| Directory   | Command                                                                             | Actual result                                                                |
| ----------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `backend/`  | `.venv/bin/python -m pytest -q`                                                     | **87 passed**, 1 existing Starlette/httpx deprecation warning; 3.14 s        |
| `backend/`  | `.venv/bin/ruff check .`                                                            | Passed                                                                       |
| `backend/`  | `.venv/bin/ruff format --check .`                                                   | Passed; 44 files already formatted                                           |
| `frontend/` | `pnpm typecheck`                                                                    | Passed                                                                       |
| `frontend/` | `pnpm lint`                                                                         | Passed without warnings                                                      |
| `frontend/` | `pnpm format:check`                                                                 | Passed                                                                       |
| `frontend/` | `pnpm exec prettier --check messages/*.json`                                        | Passed                                                                       |
| `frontend/` | `NEXT_DIST_DIR=.next-e2e NEXT_PUBLIC_API_BASE_URL=http://localhost:8100 pnpm build` | Passed, production Webpack build                                             |
| `frontend/` | `pnpm build:e2e`                                                                    | Passed before final browser suite                                            |
| `frontend/` | `UX_CAPTURE=after pnpm test:e2e --workers=4`                                        | **119 passed, 3 existing viewport-specific skips**, 122 cases total, 2.5 min |
| Repository  | `git diff --check`                                                                  | Passed                                                                       |

The three skips are the desktop-only collapse and cookie cases on mobile and the mobile-only Sheet case on desktop. All run successfully in their applicable project. No tests were dropped; copy-dependent assertions were adjusted for the legacy dashboard entry, three-stage indicator and renamed calculation action. The new suite adds real backend comparisons, schematic layers, pointer/keyboard inspection, t0–t4 changed/unchanged paths, cost deltas, playback, draft-edit handling, previous-frame failure/retry and mobile evidence discovery. Existing session reload/memory fallback, digest corruption, unsigned JSON export, synthetic routing, weather, i18n and sidebar regressions passed.

Experimental layouts were checked at **320, 375, 768 and 1440 px**, in ID/EN and light/dark themes, with no page overflow or hydration/message errors. Desktop and mobile production screenshots of dashboard, screening, t1 navigation and generated evidence were captured before and after; the retained 16 PNGs are under `docs/screenshots/interactive-demo/`. Additional responsive captures and failure traces are ignored under `frontend/test-results/`.

Stage checks passed before their commits: dashboard responsive checks (5 passes / 1 viewport skip); screening/session checks (16 passes); corrected network inspection (2 passes); timeline/persistence checks (16 passes); complete journey, export, screenshots and synthetic checks (42 passes). Initial reciprocal-edge pointer overlap was corrected before the final passing run. Sandboxed builds/local servers could not run reliably; successful final checks used the permissioned host environment. Backend code and all transport contracts were preserved; the frontend now validates the existing scenario catalog as well.

No database, migration, platform submission, signing, physical phone, Safari/Firefox, Python 3.12 deployment runtime or cloud deployment was tested. External weather is mocked in deterministic browser tests. Source calibration, geography, licensing and safety are not validated by these software tests. No push or merge was performed, and existing unrelated local inputs remain excluded.

Earlier phase records below are historical and retain their original counts and feature descriptions.

---

# Phase 1.7 validation record

Validated locally on 2026-11-04 (Asia/Jakarta), Node.js 22.22.1, pnpm 12.16.1 and Python 3.14.4 in the existing venv. The deployment target Python 3.12 runtime was not exercised. All five stages were implemented and committed separately; no push, PR, deployment, migration or remote configuration change was performed.

| Directory   | Exact command                                                                       | Result                                                                                               |
| ----------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `backend/`  | `.venv/bin/python -m pytest -q`                                                     | **70 passed**, existing Starlette/HTTPX deprecation warning                                          |
| `backend/`  | `.venv/bin/ruff check .`                                                            | Passed                                                                                               |
| `backend/`  | `.venv/bin/ruff format --check .`                                                   | Passed; 37 files                                                                                     |
| `frontend/` | `pnpm typecheck`                                                                    | Passed                                                                                               |
| `frontend/` | `pnpm lint`                                                                         | Passed                                                                                               |
| `frontend/` | `pnpm format:check`                                                                 | Passed                                                                                               |
| `frontend/` | `NEXT_DIST_DIR=.next-e2e NEXT_PUBLIC_API_BASE_URL=http://localhost:8100 pnpm build` | Passed; production Webpack build                                                                     |
| `frontend/` | `pnpm build:e2e`                                                                    | Passed after the required build; same isolated output/API configuration                              |
| `frontend/` | `pnpm test:e2e --workers=2`                                                         | **85 passed, 3 intentional viewport-specific skips** in desktop Chromium and Pixel 7 touch emulation |
| Repository  | `git diff --check`                                                                  | Passed                                                                                               |
| Repository  | Local Markdown link scan                                                            | All relative links resolved                                                                          |

Stage-specific production browser checks also passed: Stage 1 entry/sidebar (4), Stage 2 screening (18 passed / 2 viewport skips), Stage 3 timeline/session/i18n (30 passed / 2 viewport skips), Stage 4 bilingual guide (4). The final complete suite above includes the new Stage 5 cases and all existing weather, layout, sidebar and i18n regressions. The three final skips are the mobile Sheet case on desktop and the desktop collapse/cookie cases on mobile; each runs in its applicable project. Color-environment warnings from Playwright are nonblocking.

Coverage: Dashboard CTA and two-step progress; two-action example flow; a changed manifest default to prove the example is not hardcoded; exact POST requests and real API results; shortest/alternative cards and both legs; required/distinct validation and focus on the first invalid stop; H/unreachable explanation; loading, failure and retry; edits invalidating prior results and suppressing late success/trip transfer; custom-trip navigation and refresh continuity; exact friendly-label to t0/t1/t2 mapping; t1 A→G→C / C→E→F and t2 A→B→C / C→E→F; BC/CD increases and resets, DF increase; direct-jump previous-snapshot comparison, comparison failure/retry; Previous/Next/Reset; overlapping frame requests; corrupt/unknown stored selections; blocked-storage fallback; unknown flood risk without positive safety claims; guide/glossary/help; locale, metadata and SSR; sidebar keyboard/mobile focus and touch targets; light/dark and no overflow at 320/375/1280px. Existing weather tests mock external weather while demo routing uses the real local FastAPI service with no database.

Desktop light screening and desktop/mobile dark navigation screenshots were visually reviewed; browser suites also capture guide, dashboard and Claims in both locales/themes. Artifacts remain ignored under `frontend/test-results/`. Browser tests start fresh frontend 3100/backend 8100, do not reuse servers or need database credentials, and use `.next-e2e`. No generated build, trace or screenshot is committed.

Before: primary forms exposed graph IDs and raw t0/t1/t2 controls. After: Dashboard → example/check → two-leg route comparison → friendly simulation timeline → unavailable Claims preview, with optional settings, technical disclosures and a four-step guide. The two working driver screens have progress labels; Claims never appears as a completed operational step.

Unchanged: all backend source/fixtures, API endpoints and request/response schemas, typed API client, Pydantic/Zod scientific contracts, SQLAlchemy/Alembic, deterministic eight-node directed graph, heap Dijkstra, authored cost units, t0/t1/t2 IDs, null physical risk data, stable application URLs, Asia/Jakarta formatting, official Sidebar/transparent header trigger, weather/geolocation boundaries and unavailable Claims. New `sessionStorage` holds only validated non-sensitive demo selection IDs per tab, with explicit reset and memory fallback; no GPS, route responses or evidence records are stored.

Remaining: real driver usability review; licensed geographic roads/tiles; research datasets, calibrated risk parameters, scientifically validated Python providers/Modified Dijkstra and predictions; source quality/uncertainty checks; authenticated evidence storage/signing/verification; live Neon/PostGIS and deployment runtime validation. Physical phones, Safari and Firefox were not tested. No new weather integration, telemetry, authentication, token issuer or production importer was introduced. Dataset-independent priorities are documented in ROADMAP.

Changed files (new components: `frame-changes.tsx` and Radix-backed `ui/collapsible.tsx`; new regression suite: `journey.spec.ts`):

- [README.md](../README.md)
- [docs/ARCHITECTURE.md](ARCHITECTURE.md)
- [docs/DEMO-SIMULATION.md](DEMO-SIMULATION.md)
- [docs/LOCALIZATION.md](LOCALIZATION.md)
- [docs/ROADMAP.md](ROADMAP.md)
- [docs/USER-GUIDE.md](USER-GUIDE.md)
- [docs/VALIDATION.md](VALIDATION.md)
- [frontend/messages/en.json](../frontend/messages/en.json)
- [frontend/messages/id.json](../frontend/messages/id.json)
- [frontend/src/app/(dashboard)/dashboard/page.tsx](<../frontend/src/app/(dashboard)/dashboard/page.tsx>)
- [frontend/src/app/(dashboard)/guide/page.tsx](<../frontend/src/app/(dashboard)/guide/page.tsx>)
- [frontend/src/components/demo/demo-session.tsx](../frontend/src/components/demo/demo-session.tsx)
- [frontend/src/components/demo/frame-changes.tsx](../frontend/src/components/demo/frame-changes.tsx)
- [frontend/src/components/demo/navigation-workspace.tsx](../frontend/src/components/demo/navigation-workspace.tsx)
- [frontend/src/components/demo/pre-order-workspace.tsx](../frontend/src/components/demo/pre-order-workspace.tsx)
- [frontend/src/components/demo/route-results.tsx](../frontend/src/components/demo/route-results.tsx)
- [frontend/src/components/demo/schematic-network.tsx](../frontend/src/components/demo/schematic-network.tsx)
- [frontend/src/components/layout/app-shell.tsx](../frontend/src/components/layout/app-shell.tsx)
- [frontend/src/components/ui/collapsible.tsx](../frontend/src/components/ui/collapsible.tsx)
- [frontend/tests/demo.spec.ts](../frontend/tests/demo.spec.ts)
- [frontend/tests/guide.spec.ts](../frontend/tests/guide.spec.ts)
- [frontend/tests/i18n.spec.ts](../frontend/tests/i18n.spec.ts)
- [frontend/tests/journey.spec.ts](../frontend/tests/journey.spec.ts)
- [frontend/tests/workspace.spec.ts](../frontend/tests/workspace.spec.ts)

Git scope: `HydroGig_Codex_Phase_1_7_Driver_First_UX.md` remains untracked and excluded. `PROMPT.md` was not staged. Pre-existing deletions of `docs/HydroGig_UI_Refinement_Codex_Prompt.md`, `docs/PHASE-1.5-IMPLEMENTATION.md`, and `docs/PHASE-1.6-IMPLEMENTATION.md` remain unstaged. README/ROADMAP links now reference available current documentation, without restoring or committing those deleted files.

Historical records follow; their test counts and feature status describe the earlier phases.

---

# Phase 1.6 validation record

Validated locally on 2026-11-04 (Asia/Jakarta), Node.js 22.22.1, pnpm 12.16.1, Python 3.14.4 in the existing backend venv. Vercel's requested Python 3.12 runtime is not verified by this run.

| Check                                    | Final result                                                                                                                               |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Backend `python -m pytest -q`            | **70 passed**                                                                                                                              |
| Backend `ruff check .`                   | Passed                                                                                                                                     |
| Backend `ruff format --check .`          | Passed; 37 files                                                                                                                           |
| Backend `python -m pip check`            | No broken requirements                                                                                                                     |
| Frontend `pnpm typecheck`                | Passed                                                                                                                                     |
| Frontend `pnpm lint`                     | Passed                                                                                                                                     |
| Frontend `pnpm format:check`             | Passed                                                                                                                                     |
| Frontend `pnpm build`                    | Passed; production Webpack build, isolated output/API environment below                                                                    |
| Frontend `pnpm test:e2e`                 | **63 passed, 3 intentionally skipped**; desktop Chromium and mobile touch emulation                                                        |
| Live Open-Meteo smoke                    | A valid normalized response, units and model timestamp returned on retry after an unavailable first attempt                                |
| Documentation links / `git diff --check` | Passed                                                                                                                                     |
| Visual review                            | Dashboard, Guide, Claims, screening and navigation, ID/EN, light/dark; loaded weather at 320px; screenshots remain ignored local artifacts |

The required production command ran as `NEXT_DIST_DIR=.next-e2e NEXT_PUBLIC_API_BASE_URL=http://localhost:8100 pnpm build` from frontend. `pnpm build:e2e` provides the same configuration. Browser tests start fresh production frontend 3100 and backend 8100, with blank DB URLs and test-only explicit CORS. This avoids reusing or overwriting concurrent dev servers on 3000/8000. No live DB is needed; external weather is mocked for deterministic API/browser tests.

Coverage includes transparent sidebar trigger/default/hover, expanded/collapsed state, icon tooltips, Ctrl+B/Enter, visible focus, persisted official sidebar cookie, mobile Sheet close/Escape/route-selection focus restoration, bottom bar touch targets and footer clearance, all five routes, 320/375px phone and 1280px desktop, both locales/themes, and no horizontal overflow or hydration/message errors. Translation tests compare all keys/placeholders, reject obvious hardcoded JSX copy, check invalid-cookie fallback and SSR, metadata on every locale switch, and preserve a selected form stop/EWS frame.

Weather tests verify no GPS/API request on initial load, one explicit location request, two-decimal request coordinates, honest manual/device labeling, denied/unsupported/timeout/offline states, loading, normalized units and attribution, model/retrieval timestamp semantics, partial/null values, malformed/empty/HTTP/timeout provider errors, throttled interval retry, stale model timestamps, and retaining the last response with an outdated-data label after failed refresh. Logging sanitization is covered without printing upstream bodies/coordinates. Demo tests retain real local API routing, distinct-stop validation, unreachable routes, t0/t1/t2 changes, shared trip state, simulated warnings, malformed-data rejection, stale-result removal, and honest unavailable Claims.

Three intentional skips are viewport-specific: mobile Sheet checks are skipped in the desktop project; desktop collapse and desktop cookie/focus checks are skipped in the mobile project. Each runs in its applicable project. Responsive suites use 1280px in desktop and 320/375px in touch emulation, avoiding duplicate cross-project screenshots.

During development, a reused dev server disrupted one browser run; dedicated build directories/ports resolved this. ESLint initially scanned the new generated build directory; `.next-*/**` is now excluded. A combined long build/test command was terminated before completion; the final browser phase ran separately. A test refactor omitted the `isMobile` fixture argument; typecheck and browser tests caught it, the test was corrected, and the final suite was rerun. These intermediate failures are not counted as successful validation.

Nonblocking notices: Starlette TestClient emits the existing HTTPX-to-HTTPX2 deprecation warning; Playwright emits its terminal color warning. Optional next-intl extraction/watcher native build scripts are explicitly disabled; this application does not use extraction, and production builds pass.

Unverified: live Neon/PostGIS migration and schema checks, real geographic road/tile integration, calibrated scientific data/models, auth/RBAC and evidence persistence/signing, actual phone/Safari/Firefox, Vercel/serverless execution and hosting-level query-log redaction. Client throttling is not global provider quota enforcement. No push, PR, deployment or migration was performed. `PROMPT.md` was not staged. An unrelated deletion of `docs/HydroGig_UI_Refinement_Codex_Prompt.md` and the untracked Phase 1.6 input guide were preserved outside the commits.

Historical validation records follow; their feature status and test counts apply to the earlier phase only.

---

# UI refinement validation record

Validated locally on 2026-11-04 (Asia/Jakarta), using the existing Node.js 22.22.1, pnpm 12.16.1 and Python 3.14.4 installations. The existing uncommitted Phase 1.5 foundation was preserved in a separate checkpoint commit before the frontend refinement stages. No backend logic was changed by the refinement.

| Check                                     | Result                                                                                                   |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Backend `.venv/bin/python -m pytest -q`   | **47 passed**                                                                                            |
| Backend `.venv/bin/ruff check .`          | Passed                                                                                                   |
| Backend `.venv/bin/ruff format --check .` | Passed; 33 files                                                                                         |
| Frontend `pnpm typecheck`                 | Passed                                                                                                   |
| Frontend `pnpm lint`                      | Passed                                                                                                   |
| Frontend `pnpm format:check`              | Passed                                                                                                   |
| Frontend `pnpm build`                     | Passed; production Webpack build                                                                         |
| Frontend `pnpm test:e2e`                  | **26 passed, 2 intentionally skipped**, after production build                                           |
| Visual review                             | Desktop and phone screenshots in light/dark themes; readable controls and schematic, no visible clipping |
| `git diff --check`                        | Passed                                                                                                   |

Browser coverage includes the official sidebar header trigger, brand/trigger bounds, 64px collapsed rail and icon bounds, active links, tooltips, Enter and Ctrl+B, automatic content resizing, one mobile dialog, close/Escape/route-selection focus restoration, all direct routes, and theme persistence. Workflow tests exercise real local FastAPI screening, validation without invalid requests, shared trip/frame state, warning and schematic changes, unavailable routes, malformed responses, API failure/retry, stale-result removal, keyboard disclosure, and explicit loading. Both projects also check all four routes at 320px in light/dark themes with reduced motion. The two skips apply only to the other viewport's sidebar interaction.

Screenshots are local ignored artifacts under `frontend/test-results/`, including Dashboard light/dark, screening, Navigation light/dark, collapsed sidebar, mobile drawer and Claims. The official Radix Nova source was fetched from [the shadcn registry](https://ui.shadcn.com/r/styles/radix-nova/sidebar.json) and compared with the existing generated component; its provider, Sheet, gap/container, menus and tooltip composition match. The CLI's read-only `shadcn view sidebar` request timed out, but direct registry retrieval succeeded; reinstalling the existing component was unnecessary.

Remaining limits: no live PostgreSQL/PostGIS, licensed geographic map tiles, scientific data/model integration, physical-device/Safari/Firefox testing, or deployment was performed. The backend test client emits its existing HTTPX deprecation warning; Playwright emits its terminal color warning. Neither blocks validation. Work is committed locally by stage; no push or deployment was performed. `PROMPT.md` remains untouched and untracked.

The records below are historical and describe earlier runs.

---

# Phase 1.5 validation record

Validated locally on 2026-11-04 (Asia/Jakarta) with Node.js 22.22.1, pnpm 12.16.1 and Python 3.14.4. Commands ran in the existing backend virtual environment and frontend installation. The Python 3.12 Vercel runtime remains unverified here.

| Check                            | Result                                                                                                              |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `backend: python -m pytest -q`   | **47 passed**, including the 13 existing tests                                                                      |
| `backend: ruff check .`          | Passed                                                                                                              |
| `backend: ruff format --check .` | Passed; 33 Python files formatted                                                                                   |
| `frontend: pnpm typecheck`       | Passed                                                                                                              |
| `frontend: pnpm lint`            | Passed                                                                                                              |
| `frontend: pnpm format:check`    | Passed                                                                                                              |
| `frontend: pnpm build`           | Passed, Next.js 16.4.4 production Webpack build                                                                     |
| `frontend: pnpm test:e2e`        | **22 passed, 2 intentionally skipped** across desktop Chromium and Pixel 7 emulation, after the production build    |
| `git diff --check`               | Passed                                                                                                              |
| Visual review                    | Desktop light screening and mobile dark navigation screenshots reviewed; no visible clipping or horizontal overflow |

The two skips are viewport-specific: the desktop-only collapse test is skipped on mobile, and the mobile-only focus/dialog test is skipped on desktop. Both run and pass in their applicable project. The original eight browser checks remain, with disabled-placeholder expectations updated for the now-interactive demo pages.

Backend coverage includes database-free manifest/scenario/network/frame/screen requests, deterministic fixture isolation, complete route reconstruction and costs across all three frames, directed/unreachable legs, parallel/two-way/zero-cost routing, invalid IDs/payloads/steps, invalid networks/CRS/timestamps/risk, missing/negative/nonfinite costs, request/response schemas, claim unavailability and restricted POST CORS. Frontend coverage includes header collapse/expand, icon tooltips, content resizing, keyboard shortcut, mobile close/Escape/focus return, validated form selections, successful real backend screening, shared trip/frame state, EWS warnings and changes, unavailable journeys, malformed/failing API data, recovery, stale-result removal, themes and overflow.

The first expanded browser run found that the official mobile Sidebar's programmatic trigger did not restore focus when its sheet closed. The generated component now records the opener and restores it via Radix onCloseAutoFocus; the complete suite subsequently passed. The generated media-query hook was updated to useSyncExternalStore to satisfy the repository's React lint rules and preserve hydration behavior.

FastAPI's Starlette test client emits its existing HTTPX deprecation warning; there are no test failures. Playwright reports a harmless terminal color-environment warning.

No PostgreSQL credentials, live Neon/PostGIS migration cycle, external scientific module, geographic tile service, physical mobile device or cloud deployment was used. No migration, infrastructure creation, commit, push or deployment was performed. SQLAlchemy models and Alembic history are unchanged. PROMPT.md remains an untouched, untracked local input. All runnable demo features use clearly labeled deterministic synthetic fixtures; no hydrodynamic model, calibrated risk engine or real-time flood monitoring is claimed.

The earlier Phase 1 record below is retained as historical evidence; its feature-availability statements describe that earlier phase.

---

# Phase 1 validation record (historical)

Validated locally on 2026-11-03 using Node.js 22.22.1, pnpm 12.16.1, and Python 3.14.4. Backend source targets Python 3.12+ and Vercel is configured for 3.12; that deployment runtime has not been executed here.

| Check                                                 | Result                                                                                                                                                                     |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `backend: python -m pytest -q`                        | 13 tests passed: health, safe missing/configured database status, bounded probe failure, settings, CORS, OpenAPI/docs, structured logging, model DDL and offline migration |
| `backend: ruff check .`                               | Passed                                                                                                                                                                     |
| `backend: ruff format --check .`                      | Passed                                                                                                                                                                     |
| `backend: python -m pip check`                        | No broken requirements                                                                                                                                                     |
| `frontend: pnpm typecheck`                            | Passed                                                                                                                                                                     |
| `frontend: pnpm lint`                                 | Passed without warnings after PostCSS configuration cleanup                                                                                                                |
| `frontend: pnpm format:check`                         | Passed                                                                                                                                                                     |
| `frontend: pnpm build`                                | Passed using the explicit Next.js Webpack builder; all four application routes and root entry generated                                                                    |
| `frontend: pnpm test:e2e`                             | 8 tests passed across desktop Chromium and Pixel 7 viewport/touch emulation                                                                                                |
| `frontend: pnpm dev --hostname 127.0.0.1 --port 3001` | Started successfully; HTTP 200 for `/dashboard` and `/navigation`                                                                                                          |
| Offline Alembic upgrade SQL                           | Compiled all six domain tables, foreign keys, provenance constraints and four GiST indexes without a connection                                                            |
| Light/dark visual inspection                          | Reviewed full-page desktop light and mobile dark screenshots; no visible clipping or horizontal overflow                                                                   |

Browser checks use a real local FastAPI server with blank database URLs. They verify the connected API and unconfigured database indicators, direct route access, sidebar collapse/expansion, mobile Radix drawer navigation, disabled future actions, theme persistence, Sonner refresh feedback, malformed response handling, and recovery from explicitly stubbed API failures. These stubs are test-only; no fake data is shipped into the application.

The initial browser run found a missing accessible name on the mobile refresh icon; this was fixed and all eight checks subsequently passed. Initial validation also caught the missing SQLAlchemy asyncio extra; it is now included. Turbopack could not bind its CSS worker port in this execution environment, including an escalated attempt. The documented development/build scripts select the officially supported Webpack builder and standard Tailwind PostCSS integration.

FastAPI's current Starlette test client emits a deprecation warning for HTTPX 0.28 usage. HTTPX remains installed as required, and the tests pass. This is a test-client dependency migration notice, not an API runtime failure.

## Unavailable infrastructure and remaining verification

- No Neon credentials or running PostgreSQL/PostGIS instance were provided. No live database connection, upgrade/downgrade cycle, extension query, or schema-drift check was performed. These must be run on a provisioned development branch using [DATABASE.md](DATABASE.md).
- No deployment or cloud resources were created. Vercel project settings, Python 3.12 deployment execution, preview CORS/access settings, and Neon credentials still need manual configuration and post-deployment checks.
- MapLibre's adapter is type-checked but is not mounted in Phase 1; no real tile provider or WebGL map integration is claimed as tested.
- Browser tests use Chromium and mobile emulation, not physical phones or Safari/Firefox.
- No hydrological measurements, validated risk thresholds, routing algorithms, predictions, or signed evidence have been implemented or validated.
