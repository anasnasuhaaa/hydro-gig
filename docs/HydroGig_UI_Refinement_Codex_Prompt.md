# HydroGig-Mesh — Codex Implementation Prompt

## Task: Official shadcn/ui Sidebar Migration + Focused UI/UX Redesign

You are a senior frontend engineer and product designer working on the existing **HydroGig-Mesh** codebase.

**Repository:** `https://github.com/anasnasuhaaa/hydro-gig`

**Primary objective:** Replace the handwritten collapsible sidebar with the **actual, official shadcn/ui Radix Sidebar implementation**, then refine the app's UI into a polished, clear, mobile-first navigation product with **substantially less unnecessary text**.

**This is an implementation task, not a proposal. Edit the existing source code, run checks, and deliver the changes.**

### Required references

- **Official Radix Sidebar (mandatory):** https://ui.shadcn.com/docs/components/radix/sidebar
- Existing project instructions: `AGENTS.md`, `README.md`, `docs/ARCHITECTURE.md`
- Existing component registry: `frontend/components.json` (`radix-nova`)
- Existing shell: `frontend/src/components/layout/app-shell.tsx`
- Existing pages: `frontend/src/app/(dashboard)/dashboard/page.tsx`, `pre-order/page.tsx`, `navigation/page.tsx`, `claims/page.tsx`
- Existing shared components and themes: `frontend/src/components/shared/`, `frontend/src/components/dashboard/`, `frontend/src/app/globals.css`

**Before editing:** Inspect the CURRENT CHECKED-OUT working tree, including uncommitted changes. The publicly visible GitHub branch may lag behind the local Codex working copy. Respect newer implementations already present; do not overwrite current functionality with an older version. Do not reinitialize, clone, or restructure the monorepo.

---

## 1. Non-negotiable: Use the REAL shadcn/ui Sidebar

The old publicly visible `app-shell.tsx` implements sidebar collapse using `useState(false)`, a handwritten `<aside>`, manual `lg:pl-20`/`lg:pl-64` content offsets, and a bottom "Collapse sidebar" button. **This is exactly what must be removed if it still exists. Merely moving that button to the top does NOT fulfill this task.**

### Installation and primitives

From `frontend/`, install the official component if it is not already present:

```bash
pnpm dlx shadcn@latest add sidebar
```

Use the generated `@/components/ui/sidebar` implementation matching this project's **Radix Nova** registry. Compose the shell using the official primitives as appropriate:

- `SidebarProvider`
- `Sidebar`
- `SidebarHeader`
- `SidebarContent`
- `SidebarGroup` / `SidebarGroupContent`
- `SidebarMenu` / `SidebarMenuItem` / `SidebarMenuButton`
- `SidebarTrigger`
- `SidebarInset` (if using the inset layout variant)
- `useSidebar` only when necessary
- `SidebarFooter` only if useful (not for a collapse control)

Use `<Sidebar collapsible="icon">` for desktop: collapse to an icon rail, **not** to a completely hidden panel. Use the official sidebar's internal state and responsive mobile behavior; do not build a parallel sidebar state machine.

### Exact interaction and placement requirements

1. Put the **icon-only collapse/expand trigger at the TOP**, inside the `SidebarHeader` near the HydroGig-Mesh brand. It must be visible in both expanded and collapsed desktop states.
2. Prefer the actual `SidebarTrigger` instead of a custom `Button` with `onClick={() => setCollapsed(...)}`. Use the official sidebar context to obtain state only if required for icon/label presentation.
3. In expanded mode, show the brand and the four existing navigation items. In collapsed mode, keep a narrow, polished icon rail, visible navigation icons, correct active states, and accessible tooltips.
4. Ensure the trigger remains clickable and correctly aligned when collapsed. The brand must not overlap the trigger or disappear unpredictably.
5. Remove the **bottom** "Collapse sidebar" button entirely. Remove manual `collapsed` state, width switching, manual desktop sidebar offsets, and redundant drawer state once replaced.
6. Use the same sidebar component's responsive mobile behavior (the official implementation uses a mobile Sheet). **Do not nest a second handmade Sheet/menu over it.** On mobile, show one clear menu trigger in the top bar, close navigation on route selection, and preserve focus management.
7. Preserve `next/link`, `usePathname`, active-route indication, hover/focus states, tooltips, keyboard navigation, accessible names, and the documented keyboard shortcut where supported by the generated component.
8. Keep the top bar compact: current page title, mobile menu when applicable, and theme toggle. Avoid duplicate titles, breadcrumbs, or location labels if they do not assist the user.
9. Ensure the content layout naturally fills the space when the sidebar expands/collapses. Avoid horizontal scroll, overlap, clipping, hydration mismatches, or large layout jumps.
10. Verify expanded, collapsed, keyboard-toggle, mobile-drawer, and direct-route navigation with browser-level tests.

**Acceptance criterion:** The application imports and renders the official generated shadcn `Sidebar` primitives. A code review should find **no custom desktop `<aside>` collapse implementation** and **no handwritten bottom collapse button**.

---

## 2. Product UX direction: Less text, more useful interface

Target user: a motorcycle ride-hailing driver using a phone, often wanting to understand the screen in seconds. Visual polish matters, but clarity matters more.

**Design principle: Action first. Explain only when it affects the decision.**

### Visual direction

- Modern climate-tech, map/navigation-inspired, clean and premium rather than a generic admin template.
- Intentional bento-like composition where useful, not a grid of repetitive cards.
- Retain the existing teal/ocean-blue identity, neutral surfaces, soft borders, and Geist sans-serif font.
- Improve spacing, alignment, visual rhythm, semantic colors, hierarchy, and contrast in light and dark themes.
- Use shadcn/ui + Radix for primitives, Lucide React for icons, Sonner for meaningful feedback, and Recharts only for real or explicitly labeled synthetic data that warrants a chart.
- Avoid a new UI framework, heavy animation, excessive gradients, glassmorphism, random illustrations, or ornamental charts.
- Prefer mobile-first layouts. Primary actions should be obvious and reachable without hunting through informational cards.

### Aggressively simplify copy and microcopy

Review all dashboard and workflow screens; delete or consolidate text that does not help users decide or act.

- Prefer **one short heading and at most one useful supporting sentence** per major screen/section.
- Prefer concise, meaningful action labels: `Screen route`, `Open navigation`, `View claims`, `Retry`.
- Eliminate redundant eyebrow labels, all-caps overlines, tiny captions, section numbers (`/ 01`), lengthy marketing prose, filler text, redundant breadcrumbs, and repeated feature explanations.
- Do not repeat "research", "foundation", "in development", or the same warning in every card and section.
- Use **one clear, contextual prototype/simulated-data notice** per relevant screen; keep mandatory safety/provenance information visible but brief. Never hide important warnings in a tooltip or dismiss safety limitations altogether.
- Do not create visual hierarchy by making important information microscopic. Avoid 10px and 11px decorative labels; ordinary supporting text should generally be comfortably readable (~14px or larger) with good contrast.
- Show units and timestamps when needed for interpretation. Do not remove scientifically important provenance or accessibility labels in the name of minimalism.
- If data is missing, show a concise truthful empty state and one helpful next action rather than multiple paragraphs explaining future features.
- Do not substitute made-up statistics, fake live warnings, or fake "safe route" signals just to populate the UI.

### Recommended information hierarchy

1. **Current action or state** (what can the driver do now?).
2. **Primary visualization/result** (route, scenario, alert, or no data).
3. **One next action**.
4. Secondary details via compact disclosure or a contextual panel when genuinely needed.

---

## 3. Screen-by-screen redesign

**First inspect whether the locally checked-out code already contains functional Phase 1.5 demo endpoints, route selectors, a scenario timeline, or a schematic graph. Preserve and visually improve any existing working features rather than replacing them with static placeholders.**

### `/dashboard`

Turn the current text-heavy overview into a focused, attractive launch surface:

- One strong headline such as **"Navigate with flood awareness."** and one short supporting sentence only if necessary.
- One obvious primary action leading to Pre-order.
- Compact navigation/action cards for **Pre-order**, **Navigation**, and **Claims**, with consistent Lucide icons and brief labels.
- Show a single unobtrusive prototype notice appropriate to the current capabilities.
- Keep real API/backend connection status available, but visually secondary; consider a small status section or compact expandable status panel. Do not imply that API availability means live flood-data availability.
- Remove the large research-explanation card, repeated feature paragraphs, decorative numbering, and redundant marketing sections if they do not aid navigation.

### `/pre-order`

- Make the route-screening interaction the visual focus **if already implemented**: origin, pickup, destination, scenario choice, screen action, concise result or route comparison.
- Group fields logically and keep the primary button easy to locate.
- Keep risk/provenance labels honest, visible, and understandable.
- If functionality is not yet implemented in the current branch, retain a concise unavailable state instead of creating fake working controls.
- Avoid a three-step explanatory essay next to a disabled button.

### `/navigation`

- Prioritize the map or **clearly labeled schematic network** and scenario/time controls if they already exist.
- Use a compact warning/status strip and a focused route panel.
- If no active navigation/demo exists, show a clean empty state with a route to the appropriate next action.
- Do not imply live monitoring, actual positioning, or scientifically validated safety recommendations without evidence.
- Prefer spatial context and meaningful state changes over paragraphs describing planned functionality.

### `/claims`

- Prioritize claims list/status and one primary action **only if those features really work**.
- Otherwise use one concise empty/unavailable state, not a multi-step text tutorial.
- Keep any token provenance, verification, and platform-acceptance limitations accurate.

### Shared components

- Refactor `FeaturePage` if it enforces the same oversized informational template on all three workflows. A flexible composition is better than repetitive empty-state cards.
- Keep `PageHeading`, status widgets, and layout helpers only if they earn their visual space.
- Avoid duplicating the same notice inside the page and the card below it.
- Retain useful loading, error, empty, and responsive states.

---

## 4. Technical boundaries and library rules

- **Frontend-focused change.** Do not rewrite the FastAPI architecture, risk calculations, graph routing, migrations, or API contracts merely to redesign the UI.
- Preserve existing functional API calls, TanStack Query hooks, Zod validation, React Hook Form, MapLibre integration, and current demo scenario semantics if they exist.
- Do not alter simulated/observed/model-predicted provenance meanings. Unknown flood information must never become "low risk" by default.
- Use only real backend state when claiming a feature has succeeded. For non-functional actions, provide a clearly disabled or unavailable state.
- Do not change route paths, authentication assumptions, or infrastructure settings without a compelling reason.
- Keep accessibility: semantic headings, keyboard access, focus visibility, screen-reader names, touch targets, adequate contrast, and `prefers-reduced-motion` support.
- Do not introduce horizontal overflow on small phones or force dense desktop-only UI onto mobile.
- Keep the repo's existing formatting, linting, and component conventions.

---

## 5. Verification requirements

Audit the actual implementation, not just the rendered appearance.

### Required sidebar checks

- `frontend/src/components/ui/sidebar.tsx` exists (official generated variant).
- Shell imports the official shadcn sidebar components.
- Header trigger works in both expanded and icon-collapsed desktop states.
- Expanded brand and collapsed icons do not overlap.
- No bottom collapse button remains.
- No manual `useState`-driven desktop width classes or `lg:pl-*` sidebar offset logic remain.
- No duplicate mobile Sheet/drawer remains.
- Active navigation, tooltips, direct navigation, keyboard accessibility, and theme toggle still work.

### UI checks

- Desktop and mobile layouts have clear hierarchy and no unnecessary tiny text.
- Content is readable in both themes, and focus states are visible.
- Existing functional screens remain functional.
- API disconnect/error, loading, empty data, and simulated data states remain honest.
- No fabricated operational metrics, risk classifications, live observations, or predictions are introduced.

### Automated validation

From `frontend/`, run the existing project checks as feasible:

```bash
pnpm typecheck
pnpm lint
pnpm build
pnpm test:e2e
```

Update/add Playwright tests for the official sidebar header trigger, icon-only state, mobile navigation, and key page layouts. Test more than a single happy-path desktop view. Inspect screenshots if browser testing is available.

Run relevant backend tests only if backend files were changed. Do not claim a successful test unless actually executed; disclose environment-related blockers.

---

## 6. Completion / deliverable

Implement directly in the existing working tree, without committing, pushing, or deploying automatically.

When finished, report:

1. **Official sidebar proof:** installed component path, imported primitives, trigger location, and confirmation that the old manual collapse code is gone.
2. **UI improvements:** concise before/after summary for Dashboard, Pre-order, Navigation, and Claims.
3. **Preserved functionality:** what remained operational and what is still unavailable.
4. **Files changed** and any new shadcn components.
5. **Validation results** and any remaining issues.

**Definition of done:** The app genuinely uses the official Radix shadcn/ui Sidebar, the desktop collapse control is a compact icon at the top, mobile navigation works, the interface is visibly more polished and action-oriented, and small/repetitive explanatory copy is materially reduced without hiding critical safety or simulation information.

**Start by inspecting the current project files and implementing the changes now. Do not stop at a design proposal.**
