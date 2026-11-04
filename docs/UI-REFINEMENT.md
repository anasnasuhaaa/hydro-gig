# UI refinement delivery

Implemented on 2026-11-04 against the current working tree, including its functional Phase 1.5 demo. The user's instruction to commit each stage takes precedence over the input document's default no-commit instruction. No push or deployment was performed; `PROMPT.md` remains an untracked local input.

## Official sidebar proof

- Component: [`frontend/src/components/ui/sidebar.tsx`](../frontend/src/components/ui/sidebar.tsx), verified against the [official Radix Nova registry](https://ui.shadcn.com/r/styles/radix-nova/sidebar.json) and [Sidebar documentation](https://ui.shadcn.com/docs/components/radix/sidebar). This generated implementation already existed in the working tree; no replacement primitive or new package was needed.
- [`app-shell.tsx`](../frontend/src/components/layout/app-shell.tsx) renders `SidebarProvider`, `Sidebar`, `SidebarHeader`, `SidebarContent`, `SidebarGroup`, `SidebarGroupContent`, `SidebarMenu`, `SidebarMenuItem`, `SidebarMenuButton`, `SidebarTrigger`, and `SidebarInset`.
- Desktop uses `collapsible="icon"`. The 44px icon-only trigger is inside the top `SidebarHeader` in both states. The expanded wordmark makes room for it; the collapsed header deliberately shows only the trigger, aligned with the navigation rail.
- State, shortcut, width/gap behavior, tooltip visibility and mobile Sheet belong to the generated sidebar. The shell has no manual collapsed state, desktop `<aside>`, `lg:pl-*` offsets, bottom collapse control, or second Sheet. `useSidebar` supplies presentation state and closes mobile navigation on route selection.
- Existing focus-restoration and hydration-safe media-query adaptations were retained. Navigation labels and active routes remain accessible; tooltips support the icon rail. The top bar contains only the current page, mobile trigger where applicable, and theme toggle.

## Screen changes

| Screen | Before | Delivered |
| --- | --- | --- |
| Dashboard | Multiple introductory headlines, large research card, numbered feature explanations | One headline and primary screening action, three compact workflow links, one prototype notice and secondary real connectivity status |
| Pre-order | Explanatory headings and verbose next action around the working form | Short heading, grouped stop/scenario/frame selectors, full-width phone screening action, compact comparison and “Open navigation” |
| Navigation | Large controls card and repeated explanatory copy | Compact trip/scenario/frame controls, prominent schematic with readable vertical phone geometry, contextual simulated warning, route comparison |
| Claims | Three-step informational template and multiple notices | One unavailable state, disabled evidence action, concise storage/verification/platform limitations and link to screening |

The shared heading no longer adds an eyebrow or repeated phase badge. The unused `FeaturePage` essay template was removed. Route distances, units, fictional timestamps, missing scientific risk and the full simulation notice remain visible. Segment metadata, algorithm/version identifiers and additional backend caveats are available through a keyboard-accessible native disclosure. No decorative charts, fabricated metrics, live positions or safety classifications were added.

## Preserved behavior and limits

React Hook Form/Zod validation, Radix selectors, TanStack Query, typed requests and response validation remain intact. Screening still waits for the real API response before announcing success. Baseline and demo-weighted routes, directed/unreachable paths, selected trip transfer, t0/t1/t2 controls, warning changes and stale/error/loading behavior remain operational. Themes and real API/database status also remain operational.

All demo roads, distances and costs remain synthetic. Unknown flood conditions never become low risk. Live monitoring, scientific forecasts, geographic mapping and claim storage/signing/verification remain unavailable. The existing MapLibre adapter, API contracts, fixtures, routing calculations and backend architecture were not changed by the refinement.

## Changed files

Relative to the foundation checkpoint:

- Shell and official primitive provenance: `frontend/src/components/layout/app-shell.tsx`, `frontend/src/components/ui/sidebar.tsx`.
- Dashboard and Claims: `frontend/src/app/(dashboard)/dashboard/page.tsx`, `frontend/src/app/(dashboard)/claims/page.tsx`.
- Shared UI: `frontend/src/components/shared/page-heading.tsx`; removed `feature-page.tsx`; compacted `frontend/src/components/dashboard/system-status.tsx`.
- Demo presentation: `frontend/src/components/demo/{pre-order-workspace,navigation-workspace,route-results,schematic-network,shared}.tsx`.
- Browser tests: `frontend/tests/{workspace,demo}.spec.ts`.
- Documentation: `README.md`, `docs/VALIDATION.md`, this report.

No new shadcn components or dependencies were needed. Existing generated Sidebar, Select and Input components are recorded in the foundation checkpoint.

## Local stages and verification

1. `20cdeaf` — checkpoint the pre-existing Phase 1.5 foundation, keeping it separate from this redesign.
2. `afd37f7` — refine the official sidebar composition and compact shell.
3. `e51a2dd` — simplify Dashboard, Claims and shared headings/status.
4. `8d3631b` — refine functional screening, schematic navigation and route results.
5. Final validation stage — expanded browser assertions, screenshots and delivery records.

Backend pytest: **47 passed**; Ruff lint and formatting passed. Frontend typecheck, lint, formatting and production build passed. Playwright: **26 passed, 2 viewport-specific skips**, using the real local database-free backend. Tests cover desktop/mobile sidebar interactions, direct routes, focus, themes, valid/invalid requests, loading, API recovery, shared trips, frame changes, missing scientific risk, result disclosure and 320px overflow in both themes. Desktop/phone screenshots were visually reviewed. See [VALIDATION.md](VALIDATION.md) for commands, environmental limits and artifact locations.
