# Trip network enhancement

## Stage 1 — audit (2026-11-06)

Work stays on `feat/ux-flow-refinement`. The user's explicit instruction to commit each stage supersedes the input plan's no-commit text. No push or deployment. The input plan, PROMPT.md and pre-existing untracked data, scripts and dataset audit/planning documents are excluded from staging.

Read the public experimental network/workspace/comparison/timeline, Zod contracts, both message catalogs, global styles, journey/interaction/responsive/design/capture tests, README, scientific contracts, previous UX audit/validation and the installed Next.js client-component guide. Legacy demo UI, APIs, session versions, routing and evidence contracts remain outside this redesign.

Confirmed in source and rendered desktop/mobile baseline: fixed 480×440 viewBox and 528px maximum width; generic stop circles and equally weighted node IDs; straight edges and duplicated shared-route strokes/arrows; diagram pushed down by full-width controls; hover placement clamped with arbitrary percentages; raw inspector fields presented without progressive disclosure. Ordered leg sequences are available from the API but flattened into sets for drawing.

Baseline `pnpm build:e2e` passed. Existing production capture test passed in both Chromium projects (2 tests); fresh captures are in `docs/screenshots/trip-network/before/`. Desktop screening and mobile navigation were visually inspected and compared with `docs/screenshots/ux-refinement/after/`.

## Planned local commits

1. Audit and baseline (this record).
2. Ordered route geometry, distinct stops, shared-edge treatment and compact selection.
3. Progressive segment inspection, frame indicators and network-first responsive layout.
4. Focused regressions, reviewed desktop/mobile captures and final validation record.

The rendering remains a directed schematic, with unverified experimental values, no live flood monitoring, no inferred safety, geography, travel time or driver tracking.

## Stage 2 — route canvas and selection

Added ordered, connectivity-checked leg traversal and deterministic quadratic edge geometry. Shared edges draw once; reciprocal/parallel links separate and coincident geometry uses inspectable loops. A padded viewBox derives from geometry. Start/pickup/destination have localized icons, labels and a semantic stop list; other nodes are quiet waypoints. Solid selected and dashed alternative strokes use the existing objective colors. Compact comparison cards retain independent distance/objective units and workspace-owned route state.

Validation: TypeScript, ESLint and `pnpm build:e2e` passed. Existing journey/interaction suites: **22 passed** on desktop/mobile after adapting pointer tests to click actual points along curved SVG paths (bounding-box centers can miss a curve). The initial run exposed that obsolete straight-line test assumption; no assertion was removed. API calculations, timeline and session contracts are unchanged.

## Stage 3 — inspection, frames and responsive layout

The diagram now precedes the timeline and comparison on phones, with a wide diagram and compact comparison/inspection column on desktop. The timeline stays mounted during queries, preserving playback. Pinned selection lives in the workspace and follows fresh frame samples; reset or stop edits clear it. Hover uses container-relative pointer coordinates with bounded preview dimensions. Click/tap focuses the equivalent Radix selector without scrolling; Clear/Escape restores focus there.

The inspector defaults to direction, route membership, stored experimental weight and change status. Raw h/u/v, delta, length and source/unit caveats use a Radix Technical details disclosure. Changed values use small offset amber dots, leaving direction chevrons visible. Unknown remains unavailable. Short emphasis transitions respect reduced motion. Stop labels avoid node/label collisions, extend the calculated viewBox when needed, and have an HTML stop-list equivalent. Identical route sequences have an explicit shared-path note.

TypeScript, ESLint and the production e2e build passed. Expanded route-network and capture checks: **16 passed** on desktop/mobile, including five viewport widths, both locales/themes, reduced motion, fresh-frame pin persistence, missing samples, unreachable legs, reciprocal hit targets and geometry edge cases. Desktop dark and mobile light pinned renders were visually reviewed; the compact inspector and bounded desktop canvas address excessive height. Final full-suite validation follows in stage 4.

## Stage 4 — regression coverage and evidence

Added `frontend/tests/trip-network.spec.ts`. It compares ordered leg membership against real API responses for a non-default trip at t0–t4, verifies single shared strokes and dashed alternatives, checks that route-mode selection makes no API request, exercises both reciprocal hit targets and keyboard-only inspection, checks Escape/Clear focus and pinned frame refresh/reset, and tests explicit missing samples/unreachable paths. Geometry regressions cover arbitrary IDs (including `__proto__`), duplicate coordinates, reciprocal/parallel/self/short edges, deterministic ordering and disconnected sequences. Review exposed coincident reciprocal loops sharing geometry: display-coordinate grouping and separate loop placement now prevent that overlap.

Responsive tests check SVG label bounds and collisions, document overflow, pinned details, 320/375/768/1024/1440px, ID/EN, light/dark and reduced-motion durations. Existing suites retain late-response, historical frame change-versus-stable-path, playback, session, evidence, weather and legacy API regressions. Browser automation uses desktop Chromium and Pixel emulation, fresh production servers on 3100/8100, `.next-e2e`, and no database.

### Screenshot evidence

Fresh baseline captures were reviewed against the previous `screenshots/ux-refinement/after/` baseline. Representative final captures include t1 with a pinned segment. Additional theme/locale matrices are local Playwright artifacts under `frontend/test-results/`.

| Screen | Before (ID/light) | After t1, pinned (ID/light) | After t1, pinned (EN/dark) |
| --- | --- | --- | --- |
| Desktop screening | [Before](screenshots/trip-network/before/desktop-screening.png) | [After](screenshots/trip-network/after/desktop-pre-order-id-light-t1-pinned.png) | [Dark](screenshots/trip-network/after/desktop-pre-order-en-dark-t1-pinned.png) |
| Mobile screening | [Before](screenshots/trip-network/before/mobile-screening.png) | [After](screenshots/trip-network/after/mobile-pre-order-id-light-t1-pinned.png) | [Dark](screenshots/trip-network/after/mobile-pre-order-en-dark-t1-pinned.png) |
| Desktop navigation | [Before](screenshots/trip-network/before/desktop-navigation.png) | [After](screenshots/trip-network/after/desktop-navigation-id-light-t1-pinned.png) | [Dark](screenshots/trip-network/after/desktop-navigation-en-dark-t1-pinned.png) |
| Mobile navigation | [Before](screenshots/trip-network/before/mobile-navigation.png) | [After](screenshots/trip-network/after/mobile-navigation-id-light-t1-pinned.png) | [Dark](screenshots/trip-network/after/mobile-navigation-en-dark-t1-pinned.png) |

### Scope and remaining limits

Changed: experimental network, a focused geometry helper, route comparison, workspace layout/selection state, route-only CSS, both translation catalogs, browser regressions and this validation/evidence documentation. Backend, fixtures, Zod transport contracts, evidence and sessionStorage identity/version, timeline calculation/playback logic, weather and legacy demo rendering are unchanged.

Curves, offsets and label placement are presentation geometry for a schematic, not verified streets or a geographic map. Costs remain unverified experimental objectives. No water-risk thresholds, safety classifications, live flood observations, model predictions, GPS movement or ETA are introduced. No real-device/Safari/Firefox or assistive-technology certification, live database, deployment or scientific validation is claimed. No push/deployment was performed; input instructions and unrelated dataset work remain uncommitted.

### Final validation outcome

All required checks passed: backend **87 pytest tests**, Ruff lint and formatting (44 files); frontend typecheck, lint, format check, production `pnpm build` and `pnpm build:e2e`. The final complete `pnpm test:e2e --workers=4` run finished with **117 passed, 3 existing platform-specific skips, zero failures** in 2.8 minutes. See [the full validation record](VALIDATION.md) for command environments and intermediate corrections.

Final desktop/mobile screening and navigation captures were visually reviewed in ID/light and EN/dark. Stop labels stay within the SVG, selected/alternate strokes and direction cues remain distinct, and the pinned inspector is compact with raw fields disclosed on demand. Existing bottom navigation/safe-area behavior is retained. Screenshot links and `git diff --check` passed.
