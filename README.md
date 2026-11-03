# HydroGig-Mesh

A research-oriented foundation for flood-aware motorcycle ride-hailing navigation and early warnings in Bogor, Indonesia.

**Current phase: Phase 1 — Foundation, Architecture & UI Design System.** The application provides a responsive workspace, real infrastructure status, FastAPI endpoints, and a preliminary spatial schema. Route screening, live warnings, hydrological prediction, telemetry ingestion, and evidence-token generation are not operational. There is no validated flood dataset or trained DeepONet checkpoint.

## What is available

- `/dashboard`: project overview, three workflow cards, and API/database connectivity from real backend responses.
- `/pre-order`: intended pre-order screening process with an explicit unavailable state.
- `/navigation`: future navigation workspace, with no active trip or live flood layer.
- `/claims`: future incident/evidence workflow, with token creation disabled.
- Responsive collapsible desktop sidebar, mobile Radix drawer, light/dark/system theme support, self-hosted Geist, loading/error/empty states, and Sonner notifications.
- Database-independent liveness and bounded database status checks; six PostgreSQL/PostGIS models and a manual Alembic migration.

Unknown environmental data is never presented as low risk. No operational metrics or decorative chart data are fabricated. These pages do not offer flood-safety guidance.

## Stack and library conventions

Frontend: Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, shadcn/ui Radix Nova, Lucide React, Sonner, next-themes, TanStack Query, and Zod. React Hook Form with `@hookform/resolvers`, Recharts, and MapLibre GL JS are installed for later forms, meaningful charts, and maps. No redundant component framework or Axios is used.

Use generated shadcn primitives for common UI and preserve Radix accessibility. Use Sonner exclusively for toasts, Lucide for icons, Recharts for charts, React Hook Form/Zod for validated forms, and TanStack Query for client server state. There are no input forms or charts requiring invented functionality in Phase 1. `frontend/components.json` contains the component registry, aliases, and theme configuration. Add components from `frontend/` using `pnpm dlx shadcn@latest add <component>`.

Backend: Python 3.12+, FastAPI, Pydantic v2, pydantic-settings, SQLAlchemy 2.x with asyncio, psycopg 3, GeoAlchemy2, Alembic, Uvicorn, pytest, HTTPX, and Ruff. Database target: Neon PostgreSQL with PostGIS.

Frontend dependencies are locked in `frontend/pnpm-lock.yaml`; Python manifests pin the validated direct dependency versions. See the validation notes for the runtime actually tested.

## Repository structure

```text
frontend/
  src/app/                 App Router layouts, dashboard and workflow pages
  src/components/ui/       Generated shadcn/Radix components
  src/components/layout/   Sidebar, mobile drawer, header, theme toggle
  src/components/dashboard/ API-backed infrastructure status
  src/components/shared/   Page headings and feature empty states
  src/components/maps/     Isolated client-only MapLibre adapter
  src/hooks/               TanStack Query hooks
  src/lib/api/             Typed fetch client and Zod response schema
  src/lib/providers/       Theme, Query, Tooltip, Sonner providers
  tests/                   Desktop/mobile Playwright checks
backend/
  app/api/v1/endpoints/    Thin API controllers
  app/core/                Environment settings and structured logging
  app/db/                  Declarative base and lazy engine factory
  app/models/              Six preliminary spatial domain models
  app/schemas/             Safe public response schemas
  app/services/            Status service; future scientific boundary
  alembic/                 Manual immutable PostgreSQL migration
  tests/                   API, config, deadline, and model checks
docs/                      Architecture, database, science contracts, roadmap
```

## Local development

Prerequisites: Node.js 20.9+ (Node 22 recommended), pnpm matching the package manifest, and Python 3.12+. A database is optional for starting the foundation.

Terminal 1 — backend:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements-dev.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

Terminal 2 — frontend:

```bash
cd frontend
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm dev
```

Open [the dashboard](http://localhost:3000/dashboard), [API docs](http://localhost:8000/docs), or [OpenAPI](http://localhost:8000/openapi.json). Without database credentials, the API reports `not_configured` and the dashboard still works. Start commands from their respective application directories so `.env` resolution is consistent. No application reads `PROMPT.md` at runtime.

The scripts explicitly select Next.js's supported Webpack builder because this environment blocked Turbopack's local worker ports. Tailwind uses the documented PostCSS integration. Both development and production use the same builder.

## Environment configuration

| Application | Variable | Purpose / default |
| --- | --- | --- |
| Frontend | `NEXT_PUBLIC_API_BASE_URL` | Public API origin, default `http://localhost:8000`; baked in at build time |
| Backend | `APP_ENV` | `development`, `test`, or `production`; default `development` |
| Backend | `DATABASE_URL` | Optional PostgreSQL runtime URL, typically Neon pooled, with TLS |
| Backend | `DIRECT_DATABASE_URL` | Optional direct URL preferred by Alembic |
| Backend | `CORS_ORIGINS` | Comma-separated browser origins; default `http://localhost:3000` |
| Backend | `LOG_LEVEL` | DEBUG, INFO, WARNING, ERROR, CRITICAL; default INFO |

Examples contain no credentials. `.env` files are ignored; `.env.example` files are versioned. Never put database credentials in a `NEXT_PUBLIC_` variable. Empty CORS origins means no cross-origin access; use exact frontend origins without trailing paths or slashes.

## API

| Endpoint | Behavior |
| --- | --- |
| `GET /` | API name, version, docs path |
| `GET /health` | Application liveness (`{"status":"ok"}`), independent of database |
| `GET /api/v1/system/status` | Phase, timestamp, safe database configured/reachable state, and flood-data availability |
| `GET /docs`, `/openapi.json` | Automatic API documentation and schema |

Status uses HTTP 200 when the application can report a degraded database: `not_configured`, `reachable`, or `unreachable`. It exposes no URLs, credentials, stack traces, or infrastructure hostnames. Database checks have a four-second deadline, three-second connection timeout, and two-second statement timeout. No connection opens at import/startup. No production migration runs automatically.

## Database setup and migrations

Manually create a Neon project/database, enable PostGIS (`CREATE EXTENSION IF NOT EXISTS postgis;`), and configure TLS-enabled runtime/direct URLs in the backend environment. Review the initial migration before applying:

```bash
cd backend
source .venv/bin/activate
alembic upgrade head
alembic current
```

Tables: `drivers`, `road_segments`, `flood_scenarios`, `flood_observations`, `trips`, `claims`. They use UUID keys, foreign keys, timezone-aware timestamps, provenance checks, and POINT/LINESTRING geometries with SRID 4326. No observations or model constants are seeded. [DATABASE.md](docs/DATABASE.md) documents relationships, units, GiST indexes, migration review, and the remaining live-database validation.

## Validation

```bash
cd backend
source .venv/bin/activate
python -m pytest -q
ruff check .
ruff format --check .
```

```bash
cd frontend
pnpm typecheck
pnpm lint
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
```

Playwright starts the production frontend and backend automatically; build first and install backend development dependencies. Tests use the real local backend without a database, and explicitly stub failure/malformed responses to verify UI recovery. Desktop/mobile checks cover direct routes, navigation, overflow, themes, notifications, and connectivity. On Linux, Chromium may require system libraries installed by your administrator. See [VALIDATION.md](docs/VALIDATION.md) for actual results and environmental limits.

## Independent Vercel deployment preparation

No deployment has been performed. Create two Vercel projects connected to this repository when ready:

1. Frontend: root `frontend`, framework Next.js, install `pnpm install --frozen-lockfile`, build `pnpm build`. Set `NEXT_PUBLIC_API_BASE_URL` to the HTTPS backend URL before building.
2. Backend: root `backend`, framework FastAPI/Python. The supported `app/main.py` entrypoint exports `app` and `pyproject.toml` points `tool.vercel.entrypoint` to `app.main:app`; dependencies come from `requirements.txt`. `.python-version` requests Python 3.12. No legacy `vercel.json` rewrites are necessary; see [official FastAPI deployment conventions](https://vercel.com/docs/frameworks/backend/fastapi).
3. Neon: enable PostGIS and apply reviewed migrations manually through the direct URL. Configure backend runtime `DATABASE_URL`, `APP_ENV=production`, `LOG_LEVEL=INFO`, and exact frontend `CORS_ORIGINS`. Keep migration credentials in the authorized migration environment.
4. Configure each preview environment with its own database branch and allowed frontend origin. Check API `/health`, `/docs`, system status, and dashboard connectivity after deployment. Do not disable platform protection globally to work around an incorrect CORS or deployment-access setting.

The backend has no persistent workers or long-running WebSockets. Runtime connections use NullPool for serverless compatibility. Database reachability does not prove schema/PostGIS readiness; inspect migrations and extension state separately.

## Architecture, limitations, and next work

[ARCHITECTURE.md](docs/ARCHITECTURE.md) explains component/service boundaries and request flow. [SCIENTIFIC-MODULES.md](docs/SCIENTIFIC-MODULES.md) documents the intended telemetry → assimilation → hydrodynamics → risk → routing → evidence pipeline, equations, inputs, units, calibration dependencies, and limitations. [ROADMAP.md](docs/ROADMAP.md) covers all five phases.

Remaining manual work: provision Neon/PostGIS, provide credentials, and validate a live migration cycle on a disposable development branch. Mapping needs a licensed style/tile provider and actual route/data integration. Scientific datasets, vehicle-specific thresholds, model checkpoints, evidence signing, authentication, and claim platform agreements are not available or implemented. The recommended next development phase is a separately tested mathematical risk and routing engine with defensible parameter sources and explicit uncertainty.
