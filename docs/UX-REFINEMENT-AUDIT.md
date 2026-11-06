# UX refinement audit

Date: 2026-11-06. Base: fetched `origin/main` at `6ba360b`; branch `feat/ux-flow-refinement`. Local raw datasets, audit/plan inputs, scripts and PROMPT.md were not staged. No push, merge or deployment.

## Audit and decisions

Reviewed the existing workspace, network, timeline, comparison, evidence, session, entry, journey, shell, public pages, styles and both catalogs; consulted the architecture, data/scientific contracts, dataset integration/audit/plan and Next.js client-component guide. Ran the original production journey capture on desktop/mobile before changes and inspected existing screenshots.

| Problem and friction | Implemented response |
| --- | --- |
| Mode choice precedes the actual task; direct links can flash synthetic content | Public pages mount only experimental workspaces after a hydration-safe session snapshot. Defaults are enabled; validated v1 sessions normalize the old flag without losing stops/frame/references. |
| Dashboard offers competing legacy entry | Single route-screening CTA; three stages retained once; research limitations and diagnostics use collapsed Radix disclosures. Weather permissions and attribution remain independent. |
| Navigation repeats the full trip form | Compact trip summary with edit link; timeline and diagram precede optional detail. Screening keeps a three-column stop form even on phones. |
| Every changed edge competes with the route | Subdued network, solid selected weighted route, visible baseline underlay on shared edges, independent reciprocal geometry, small changed markers only on the focused route. Full changed-edge table remains available. |
| Hover silently replaces permanent inspection | Mouse hover gives a small anchored preview; click/tap pins a separate panel. The select supports keyboard inspection and typeahead. Clear/Escape restores focus to the select. |
| Inspector always consumes space | No initial segment selection; details appear only after an explicit choice. Geometry and edge lookup maps are memoized; reciprocal lookup uses a Set rather than repeated edge scans. |
| Raw tables dominate evidence and comparison | Route-stop lists, source samples, digest and technical references use consistent Radix Collapsible triggers. Export becomes primary after creation. |
| Draft trip can be confused with a previous calculation | Inline recalculation prompt; old results and continuation are absent until the draft is applied. |
| Stable route can imply stable conditions | Backend-derived summary distinguishes route changed, route unchanged with values changed, no relevant change, initial frame, and unavailable comparison. t0–t4 and historical timestamps remain exact. |

## Information architecture and interactions

Dashboard → screening → replay → evidence remains the public journey, with stable URLs and direct entry to each stage. Default trip is N01 → N03 → N12; no invented place names. Route choices affect visual focus only. Distance and weighted objective remain distinct. Details disclose progressively instead of presenting every research field immediately.

There is no synthetic public entry or replacement mode selector. Legacy components, backend `/api/v1/demo` and all backend regression tests remain available internally. Session storage retains its existing strict version/identity validation and in-memory fallback. Invalid data gives a recovery message, reset restores t0, and hydration shows a skeleton rather than the legacy UI.

Mobile refinements include a compact stop row, shorter introduction, icon reset with accessible name, fewer duplicate timeline labels, collapsed stop sequences and source tables, and a useful schematic aspect ratio. Existing bottom-navigation clearance is retained. Desktop places change summary/comparison alongside the schematic.

Native disclosures were replaced with the installed Radix Collapsible primitive and Lucide chevrons. Triggers provide aria-expanded, keyboard behavior, visible focus and 44px minimum height. Motion respects the existing reduced-motion rule. Segment controls have localized labels; hover is optional. Diagram arrows indicate graph direction, not movement on real roads.

## Before and after

Before captures are preserved in `screenshots/interactive-demo/after/`. New captures are in `screenshots/ux-refinement/after/`; each main screen has full-page and `-viewport.png` captures for desktop and mobile.

| Screen | Before desktop / mobile | After desktop / mobile |
| --- | --- | --- |
| Dashboard | [Desktop](screenshots/interactive-demo/after/desktop-dashboard.png) · [Mobile](screenshots/interactive-demo/after/mobile-dashboard.png) | [Desktop](screenshots/ux-refinement/after/desktop-dashboard.png) · [Mobile](screenshots/ux-refinement/after/mobile-dashboard.png) |
| Screening | [Desktop](screenshots/interactive-demo/after/desktop-screening.png) · [Mobile](screenshots/interactive-demo/after/mobile-screening.png) | [Desktop](screenshots/ux-refinement/after/desktop-screening.png) · [Mobile](screenshots/ux-refinement/after/mobile-screening.png) |
| Navigation | [Desktop](screenshots/interactive-demo/after/desktop-navigation.png) · [Mobile](screenshots/interactive-demo/after/mobile-navigation.png) | [Desktop](screenshots/ux-refinement/after/desktop-navigation.png) · [Mobile](screenshots/ux-refinement/after/mobile-navigation.png) |
| Evidence | [Desktop](screenshots/interactive-demo/after/desktop-evidence.png) · [Mobile](screenshots/interactive-demo/after/mobile-evidence.png) | [Desktop](screenshots/ux-refinement/after/desktop-evidence.png) · [Mobile](screenshots/ux-refinement/after/mobile-evidence.png) |

Visual review of the first rendered pass identified oversized shared-edge arrows, an overly long mobile introduction and repeated expanded route-stop lists. These were corrected before final captures. Evidence review no longer opens with a raw sample table.

## Validation

Backend: 87 pytest tests passed; Ruff check and format check passed (44 files). One existing Starlette/httpx deprecation warning. No backend logic, fixtures, scientific constants or evidence canonicalization changed.

Frontend: TypeScript, ESLint, Prettier, production `pnpm build` and `pnpm build:e2e` passed using `.next-e2e`. Browser servers use ports 3100/8100 with no reuse or database. Final Playwright run: **103 passed, 3 platform-specific exclusions, 0 failed** (2.1 minutes). Both desktop Chromium and Pixel emulation passed. The exclusions are the existing opposite-platform sidebar tests.

The old synthetic UI assertions were migrated to the public experimental journey rather than retaining a hidden mode switch. Shared-trip/reset/corrupt-session/export/previous-frame cases are consolidated in experimental-journey and interactive-demo; demo.spec retains shell tests and tests malformed/error recovery, stale results and the legacy API directly. journey.spec adds stale-response, old-flag normalization, hover/pin/disclosure and blocked-storage coverage. Backend synthetic tests remain unchanged. No tests are skipped to conceal a failing supported behavior; platform-specific sidebar cases retain their existing desktop/mobile exclusions.

Responsive coverage uses 320, 375, 768, 1024 and 1440px in both languages/themes, plus reduced motion, overflow and bottom-navigation clearance. Playwright uses Chromium desktop and Pixel emulation; this is not a physical-device or screen-reader certification.

## Remaining limits

The graph and scenario values remain unverified software fixtures. Lower cost, a stable path or an available route never establishes safety. No validated flood measurement, trained-model output, risk threshold, ETA, traffic observation, geographic overlay or satellite provider is added. Evidence remains unsigned and unsubmitted; SHA-256 checks content consistency only. Browser storage cannot persist through reload when access is blocked. Live weather/provider reliability and physical mobile hardware were not certified by mocked browser tests. See [map readiness](GEOSPATIAL-MAP-READINESS.md).

## Changed file inventory

- `README.md`
- `docs/INTERACTIVE-DEMO-UX.md`
- `docs/USER-GUIDE.md`
- `frontend/messages/en.json`
- `frontend/messages/id.json`
- `frontend/src/app/(dashboard)/claims/page.tsx`
- `frontend/src/app/(dashboard)/dashboard/page.tsx`
- `frontend/src/app/(dashboard)/navigation/page.tsx`
- `frontend/src/app/(dashboard)/pre-order/page.tsx`
- `frontend/src/app/globals.css`
- `frontend/src/components/demo/route-results.tsx`
- `frontend/src/components/experimental/demo-entry.tsx`
- `frontend/src/components/experimental/evidence-preview.tsx`
- `frontend/src/components/experimental/network.tsx`
- `frontend/src/components/experimental/route-comparison.tsx`
- `frontend/src/components/experimental/session.ts`
- `frontend/src/components/experimental/timeline.tsx`
- `frontend/src/components/experimental/workspace.tsx`
- `frontend/src/components/ui/disclosure.tsx`
- `frontend/tests/demo.spec.ts`
- `frontend/tests/design.spec.ts`
- `frontend/tests/experimental-journey.spec.ts`
- `frontend/tests/experimental.spec.ts`
- `frontend/tests/i18n.spec.ts`
- `frontend/tests/interactive-demo.spec.ts`
- `frontend/tests/interactive-responsive.spec.ts`
- `frontend/tests/journey.spec.ts`
- `frontend/tests/ux-capture.spec.ts`
- `frontend/tests/workspace.spec.ts`
- `docs/UX-REFINEMENT-AUDIT.md`
- `docs/GEOSPATIAL-MAP-READINESS.md`
- `docs/screenshots/ux-refinement/after/`: desktop/mobile full-page and viewport captures, plus selected dark-theme captures.

## Capture measurements

Full-page raster heights at matching widths/device pixel ratios (collapsed details, default selection):

| Screen | Desktop before → after | Mobile before → after |
| --- | --- | --- |
| dashboard | 1252 → 1148 px (8% shorter) | 5471 → 4715 px (14% shorter) |
| screening | 2339 → 1758 px (25% shorter) | 9295 → 6389 px (31% shorter) |
| navigation | 2514 → 1774 px (29% shorter) | 9957 → 7193 px (28% shorter) |
| evidence | 1549 → 1167 px (25% shorter) | 6059 → 4749 px (22% shorter) |

These are screenshot dimensions, not performance benchmarks. Mobile raster pixels include device scaling. All four screens also have viewport captures so fixed navigation can be evaluated separately from full-page capture positioning.
