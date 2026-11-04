# Phase 1.6 — implementation record

Implemented in six ordered local stages on 4 November 2026. No push, PR, remote configuration change or deployment is part of this work. The existing Indonesian README draft informed the final project presentation. The input guide and an unrelated deletion of the older UI prompt are left outside the stage commits.

| Stage | Local commit | Scope and checks |
| --- | --- | --- |
| 1 | `cef0ef7` `style(ui): polish official sidebar and climate theme` | Official sidebar retained, transparent trigger including expanded state, blue/navy tokens and mobile bottom bar. Typecheck/lint/build and 2 sidebar browser checks passed. |
| 2 | `e3a0cfd` `feat(i18n): add Indonesian and English localization` | next-intl 4.14.9, SSR cookie locale, stable routes, metadata/validation/errors/warnings/units/times, ID/EN control. Full baseline browser run: 32 passed/2 skips; final targeted i18n/sidebar run: 8 passed. |
| 3 | `b03e469` `feat(weather): add consent-based location and current conditions` | Weather schema/service/router, runtime HTTPX, privacy-aware logs, typed frontend API and Query card, optional GPS/manual city. Backend 70 passed; weather browser suite 14 passed. Live provider normalization succeeded on retry after an unavailable first attempt. |
| 4 | `5b28a21` `feat(guide): add bilingual visual user guide` | `/guide`, Help links, three steps and clear data boundaries. Isolated production build/ports added after concurrent dev servers affected a test run. Guide/i18n: 10 passed. ESLint initially scanned the new generated directory; the explicit ignore was fixed in stage 5. |
| 5 | `7e5bd35` `style(app): redesign mobile-first climate dashboard and flows` | Blue dashboard, weather/workflow hierarchy, collapsed diagnostics, differentiated route alternatives/counts, frame controls, honest Claims state, sidebar-cookie restore, safe-area/toast spacing, generated-output lint ignore. Full run 57 passed/3 intentional skips; final affected-screen run 25 passed/3 skips after final UI changes. |
| 6 | See local Git history | Indonesian README, architecture/roadmap/privacy/provider/guide docs, AGENTS and final integration/quality checks. Final results are in VALIDATION.md. |

New principal paths: `frontend/messages/{id,en}.json`, `src/i18n/{request,actions,metadata}.ts`, `components/layout/language-switcher.tsx`, `components/weather/weather-card.tsx`, `lib/api/weather.ts`, `app/(dashboard)/guide/page.tsx`, `components/shared/guide-link.tsx`; backend `app/{schemas,services}/weather.py`, `app/api/v1/endpoints/weather.py`, and `tests/test_weather.py`.

Frontend dependency: next-intl. HTTPX 0.28.1 moved from development-only into backend runtime requirements. Optional native extraction/watcher build scripts are explicitly disabled; message extraction is not used and the production Webpack build passes. No additional UI framework, chart, Redis, geocoder, geographic dataset, auth provider, or scientific model was added.

The original demo fixtures, transport contracts, routing service/engine behavior, migrations and CORS policy are preserved. Test-only CORS permits the isolated frontend origin. Application `phase: foundation` remains the stable system-status contract, independent of the project development label.

Generated screenshots and traces stay ignored under `frontend/test-results/`; `.next-e2e` is ignored by Git/ESLint. Normal dev uses 3000/8000; production browser tests use 3100/8100 and fail if those ports are occupied. See [LOCALIZATION.md](LOCALIZATION.md) for the build/test procedure.

The final system still requires licensed geographic data, scientific validation, model/parameter versions and uncertainty evaluation, authentication/RBAC, evidence persistence/signing/verification, optional live PostGIS migration verification, and separately authorized deployment. Real device/Safari/Firefox and serverless hosting-log behavior are unverified.
