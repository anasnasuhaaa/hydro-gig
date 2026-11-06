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
