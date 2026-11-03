# Phase 1 validation record

Validated locally on 2026-11-03 using Node.js 22.22.1, pnpm 12.16.1, and Python 3.14.4. Backend source targets Python 3.12+ and Vercel is configured for 3.12; that deployment runtime has not been executed here.

| Check | Result |
| --- | --- |
| `backend: python -m pytest -q` | 13 tests passed: health, safe missing/configured database status, bounded probe failure, settings, CORS, OpenAPI/docs, structured logging, model DDL and offline migration |
| `backend: ruff check .` | Passed |
| `backend: ruff format --check .` | Passed |
| `backend: python -m pip check` | No broken requirements |
| `frontend: pnpm typecheck` | Passed |
| `frontend: pnpm lint` | Passed without warnings after PostCSS configuration cleanup |
| `frontend: pnpm format:check` | Passed |
| `frontend: pnpm build` | Passed using the explicit Next.js Webpack builder; all four application routes and root entry generated |
| `frontend: pnpm test:e2e` | 8 tests passed across desktop Chromium and Pixel 7 viewport/touch emulation |
| `frontend: pnpm dev --hostname 127.0.0.1 --port 3001` | Started successfully; HTTP 200 for `/dashboard` and `/navigation` |
| Offline Alembic upgrade SQL | Compiled all six domain tables, foreign keys, provenance constraints and four GiST indexes without a connection |
| Light/dark visual inspection | Reviewed full-page desktop light and mobile dark screenshots; no visible clipping or horizontal overflow |

Browser checks use a real local FastAPI server with blank database URLs. They verify the connected API and unconfigured database indicators, direct route access, sidebar collapse/expansion, mobile Radix drawer navigation, disabled future actions, theme persistence, Sonner refresh feedback, malformed response handling, and recovery from explicitly stubbed API failures. These stubs are test-only; no fake data is shipped into the application.

The initial browser run found a missing accessible name on the mobile refresh icon; this was fixed and all eight checks subsequently passed. Initial validation also caught the missing SQLAlchemy asyncio extra; it is now included. Turbopack could not bind its CSS worker port in this execution environment, including an escalated attempt. The documented development/build scripts select the officially supported Webpack builder and standard Tailwind PostCSS integration.

FastAPI's current Starlette test client emits a deprecation warning for HTTPX 0.28 usage. HTTPX remains installed as required, and the tests pass. This is a test-client dependency migration notice, not an API runtime failure.

## Unavailable infrastructure and remaining verification

- No Neon credentials or running PostgreSQL/PostGIS instance were provided. No live database connection, upgrade/downgrade cycle, extension query, or schema-drift check was performed. These must be run on a provisioned development branch using [DATABASE.md](DATABASE.md).
- No deployment or cloud resources were created. Vercel project settings, Python 3.12 deployment execution, preview CORS/access settings, and Neon credentials still need manual configuration and post-deployment checks.
- MapLibre's adapter is type-checked but is not mounted in Phase 1; no real tile provider or WebGL map integration is claimed as tested.
- Browser tests use Chromium and mobile emulation, not physical phones or Safari/Firefox.
- No hydrological measurements, validated risk thresholds, routing algorithms, predictions, or signed evidence have been implemented or validated.
