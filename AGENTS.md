<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## HydroGig-Mesh engineering rules

- Frontend lives in `frontend/`; backend lives in `backend/`. Read Next.js guides at `frontend/node_modules/next/dist/docs/` before changing framework code.
- Prefer shadcn/ui and Radix primitives for accessible UI. Preserve keyboard navigation, labels, focus handling, and touch targets. Do not build replacement primitives.
- Use Sonner for toasts, Recharts for charts, and Lucide React for icons. Do not add decorative charts or redundant UI frameworks.
- Use TanStack Query for client server state, the typed API client for requests, and React Hook Form with Zod for validated forms. Phase 1.5 demo forms use these validation boundaries.
- Keep FastAPI controllers thin; business logic belongs in services and future persistence queries in repositories. Never connect to a database at import or migrate at startup.
- Follow the scientific contracts in `docs/SCIENTIFIC-MODULES.md`. No unvalidated constants, risk thresholds, trained-model claims, or fabricated research results.
- Distinguish observed, simulated, and model-predicted data across storage, APIs, maps, charts, and exports. Label simulations visibly. Unknown data must never imply safety.
- Keep secrets server-side and out of Git/logs/status responses. Use environment examples without credentials.
- Run backend pytest/Ruff and frontend typecheck/lint/build; run Playwright after a production build for UI changes. Report unavailable infrastructure honestly.
- Preserve `PROMPT.md` as a local input: never stage it. Do not push or deploy unless explicitly requested.

## Phase 1.6 UI and weather conventions

- User-facing text belongs in both `frontend/messages/id.json` and `en.json` via next-intl. Preserve stable URLs, API IDs/provenance and the Asia/Jakarta display timezone; use safe localized errors.
- Geolocation requires an explicit user action, a single fix and rounded weather coordinates. Do not store location histories or log query coordinates. Weather is model-derived Open-Meteo context, independent of synthetic flood routing; preserve attribution, nullable fields and model/retrieval times.
- Run `pnpm build:e2e` before `pnpm test:e2e` in `frontend/`. The production tests use `.next-e2e` and dedicated ports 3100/8100, with no server reuse or database. Keep generated `.next-*` outputs ignored by Git and ESLint. If development is active, run the required `pnpm build` with `NEXT_DIST_DIR=.next-e2e NEXT_PUBLIC_API_BASE_URL=http://localhost:8100` to avoid writing its `.next` directory.
