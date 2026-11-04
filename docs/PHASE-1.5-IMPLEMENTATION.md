# Phase 1.5 implementation report

Implemented directly on the existing branch without commits, pushes or deployment. The application retains its existing architecture, health/status functionality, SQLAlchemy entities and migration history. `PROMPT.md` is untouched.

## Delivered behavior

- Official shadcn Radix SidebarProvider/Sidebar/Menu/Trigger/Inset system, with icon collapse on desktop, header control, active links, collapsed tooltips, content resizing and a single mobile sheet. Accessible labels, keyboard shortcut, touch targets and focus return are covered by browser tests.
- Pydantic v2 normalized data contracts and matching Zod schemas. Explicit CRS, stable IDs, units, provenance, versioning, temporal and unavailable-data semantics are documented in [DATA-CONTRACTS.md](DATA-CONTRACTS.md).
- Isolated deterministic fixture provider: eight schematic nodes, nine positive-length directed edges, alternative paths and a directed sink; fixed t0/t1/t2 authored cost changes. No physical observations, scientific risk values or production seed data.
- Replaceable NetworkAdapter, ScenarioProvider, WeightingProvider and RoutingEngine protocols. Temporary heap Dijkstra supports distance and authored-cost modes, nonnegative costs, parallel/two-way edges, ordered reconstruction and unreachable routes.
- Five experimental API operations: GET `/api/v1/demo/manifest`, `/scenarios`, `/network`, `/scenarios/{scenario_id}/frames/{step}`; POST `/api/v1/demo/screen`. Screening returns origin → pickup and pickup → destination, each with baseline and demonstration-weighted results. CORS permits GET/POST only from configured explicit origins.
- Interactive React Hook Form/Zod screening with shadcn selectors, TanStack mutation, Sonner feedback after success, loading/errors, route summaries and segment warnings. EWS includes default/last-screened trip selection, shared frame state, t0/t1/t2 and advance controls, simulated warnings and an isolated schematic adapter.
- Claim request/unavailable-response contracts, evidence references and server-only issuer/signer protocols. No claim endpoint, persistence, key or token generation.

## Files created

| Area | Files |
| --- | --- |
| Backend contracts | `backend/app/schemas/contracts.py`, `demo.py`, `claims.py` |
| Backend services | `backend/app/services/boundaries.py`, `routing.py`, `demo.py`, `claims.py` |
| API | `backend/app/api/v1/endpoints/demo.py` |
| Fixtures/provider | `backend/demo/__init__.py`, `provider.py`, `fixtures.json` (includes manifest) |
| Backend tests | `backend/tests/test_demo.py` |
| shadcn primitives | `frontend/src/components/ui/sidebar.tsx`, `input.tsx`, `select.tsx` |
| Demo components | `frontend/src/components/demo/demo-session.tsx`, `shared.tsx`, `pre-order-workspace.tsx`, `navigation-workspace.tsx`, `route-results.tsx`, `schematic-network.tsx` |
| Frontend hooks | `frontend/src/hooks/use-demo.ts`, `use-mobile.ts` |
| Client/contracts | `frontend/src/lib/api/demo.ts`, `frontend/src/lib/contracts/data.ts`, `claims.ts` |
| Browser tests | `frontend/tests/demo.spec.ts` |
| Documentation | `docs/DATA-CONTRACTS.md`, `DEMO-SIMULATION.md`, `PHASE-1.5-IMPLEMENTATION.md` |

## Files modified

| Area | Files |
| --- | --- |
| Backend | `backend/app/main.py`, `backend/app/core/config.py`, `backend/pyproject.toml` |
| App pages/layout | `frontend/src/app/(dashboard)/layout.tsx`, `dashboard/page.tsx`, `pre-order/page.tsx`, `navigation/page.tsx`, `frontend/src/app/globals.css` |
| Existing components/client | `frontend/src/components/layout/app-shell.tsx`, `frontend/src/components/shared/page-heading.tsx`, `frontend/src/lib/api/client.ts` |
| Existing browser tests | `frontend/tests/workspace.spec.ts` |
| Existing documentation | `AGENTS.md`, `README.md`, `docs/ARCHITECTURE.md`, `ROADMAP.md`, `SCIENTIFIC-MODULES.md`, `VALIDATION.md` |

No new dependency framework was required; existing installed libraries support the official generated components.

## Validation and limits

All required commands ran. Backend: 47 pytest tests passed, Ruff check and format check passed. Frontend: typecheck, lint, production build and format check passed; production Playwright run passed 22 tests, with two intentional opposite-viewport skips. Desktop light and mobile dark screenshots were visually reviewed. Full evidence and environment limits are in [VALIDATION.md](VALIDATION.md).

The complete demo works with blank database URLs. Live Neon/PostGIS and Vercel Python 3.12 execution remain unverified. Browser coverage is Chromium and mobile emulation. Trip/frame selection is in-memory and resets on reload. Snapshots do not predict arrival-time conditions. The schematic is not a Bogor map. Physical depth, velocity and risk are unknown; a selected route is not scientifically validated as safe.

Remaining integration: source-specific licensed GraphML/GeoJSON normalization; research team's versioned risk and Modified Dijkstra modules; real scenario edge/time mapping, uncertainty and validation; evidence specification, authorization/consent, persistence, canonicalization, HMAC signing/verification and key management; optional database verification and authorized deployment checks. See [DEMO-SIMULATION.md](DEMO-SIMULATION.md) for exact adapters, API examples and the November 6 checklist.
