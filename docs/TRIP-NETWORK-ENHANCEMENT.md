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
