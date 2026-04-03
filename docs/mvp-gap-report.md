# MVP gap report (local validation)

**Date:** 2026-05-21  
**Baseline:** `docs/05-mvp-implementation-plan.md`, `docs/launch/mvp-checklist.md`, PRD in `docs/02-product-requirements-document.md`  
**Local evidence:** `pnpm setup:local`, `pnpm dev`, `pnpm verify:local` (5/5 checks on API `:3100`)

## Summary

| Area                                                   | Status                                               |
| ------------------------------------------------------ | ---------------------------------------------------- |
| Local stack (Postgres, Redis, MinIO, API, Worker, Web) | **Runnable** with documented non-default ports       |
| Ingest → query (API)                                   | **Pass** (smoke script)                              |
| Forensic UI (no Clerk)                                 | **Pass** (loads; needs `VITE_DEFAULT_ORG_ID`)        |
| Full E2E (SDK → indexer → UI replay → export)          | **Partial** (not fully automated in verify script)   |
| Staging / design partners                              | **Not tested** (requires AWS + credentials)          |
| Worker production build (`tsc`)                        | **Fail** (imports `@api/*` source outside `rootDir`) |

## Acceptance matrix

| Criterion                           | Status     | Evidence                                            | Missing / gap                                          | Next action                                |
| ----------------------------------- | ---------- | --------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------ |
| Monorepo installs deterministically | pass       | `pnpm-lock.yaml`, `pnpm setup:local`                | —                                                      | Keep lockfile committed                    |
| Docker deps start on clean machine  | pass       | `docker compose up -d` on ports 15432/16379/19000   | Windows may reserve 9000/5432/6379                     | Document port overrides in runbook         |
| DB migrations apply                 | pass       | 11 migrations deployed after `0007` idempotency fix | Duplicate GIN index in 0003+0007 was blocking fresh DB | Fixed in `0007_search_indexes`             |
| API health (db, storage, queue)     | pass       | `GET http://localhost:3100/health` → `status: ok`   | Was 401 until middleware exclude                       | Done                                       |
| OpenAPI + `/docs`                   | pass       | `GET /openapi.yaml` HTTP 200                        | README still mentions wiring swagger (outdated)        | Update README                              |
| Ingest `POST /v1/traces`            | pass       | `verify-local.mjs` with bootstrap API key           | Requires `pnpm bootstrap:local` once                   | Document in runbook                        |
| Indexer worker consumes jobs        | partial    | Worker logs `indexer consumer started`              | Not asserted in verify script                          | Add worker queue depth check               |
| Query `GET /v1/traces`              | pass       | Smoke search finds ingested trace                   | JWT path not smoke-tested                              | Add UI e2e or Postman flow                 |
| Replay API                          | not-tested | `replay.spec.ts` unit/integration (mocked)          | No live replay smoke                                   | Call `GET /v1/traces/:id/replay` in verify |
| Export pipeline                     | not-tested | Modules wired; worker export consumer starts        | No local export job smoke                              | POST `/v1/exports` in verify               |
| Web UI trace explorer               | partial    | http://localhost:5173 loads                         | Needs org id + demo/seed data for traces               | Run `pnpm seed:demo`                       |
| Clerk auth                          | partial    | Optional; dev mode skips sign-in                    | Real OIDC needs `VITE_CLERK_*` + Clerk project         | Partner staging setup                      |
| SDK publish + quickstart            | partial    | Packages exist; not published in this session       | npm/PyPI publish is checklist item 1                   | Run release workflow                       |
| Sample app E2E                      | not-tested | `examples/copilot-support-bot`                      | Needs `AUDIT_TRAIL_API_KEY`                            | Document in runbook                        |
| RBAC / cross-tenant tests           | pass       | `pnpm --filter @audit-trail/api test` 31 passed     | Live multi-tenant not re-run                           | CI integration job                         |
| Load test / k6                      | not-tested | Scripts exist                                       | Not executed locally                                   | Run `scripts/k6/ingest-load.js`            |
| Staging deploy + 3 partners         | fail       | Documented only                                     | AWS credentials required                               | Ops task                                   |
| OWASP ZAP / dependency audit in CI  | pass       | Workflows present                                   | Not re-run locally                                     | Trust CI on `main`                         |

## Fixes applied during validation

- Non-default Docker host ports to avoid conflicts on Windows dev machines.
- `pnpm setup:local`, `bootstrap:local`, `verify:local` scripts.
- Nest module wiring: `HealthModule`, `IngestModule` import storage/queue.
- Public routes excluded from tenant middleware (`/health`, `/docs`, `/openapi.yaml`).
- Worker dev uses `ts-node` + root `.env` preload (tsx/esbuild broke decorators).
- API default port **3100** when 3000 is occupied.

## Recommended MVP closure order

1. Extend `verify:local` with replay + export smoke.
2. Fix worker `tsc` build (project references to `@audit-trail/api` dist or shared package).
3. Run sample app + Playwright trace-flow against local stack.
4. Execute staging deploy checklist with real credentials.
5. Record k6 results in `docs/performance/load-test-results.md`.
