# Local verification log

**Environment:** Windows 10, Node 22.16, pnpm 9.15, Docker 28.5  
**Date:** 2026-05-21

## Commands run

```bash
pnpm setup:local
pnpm bootstrap:local   # included in setup:local
pnpm dev             # api + web + worker (or separate filters)
pnpm verify:local
pnpm --filter @audit-trail/api test
pnpm seed:demo
```

## `pnpm verify:local` results

| Check                    | Result | Notes                                              |
| ------------------------ | ------ | -------------------------------------------------- |
| API `/health`            | PASS   | `status: ok`, db/storage/queue `up`                |
| API `/openapi.yaml`      | PASS   | HTTP 200                                           |
| Web UI                   | PASS   | http://localhost:5173 (vite may use 5174+ if busy) |
| Ingest `POST /v1/traces` | PASS   | Unique trace + event ids per run                   |
| Query `GET /v1/traces`   | PASS   | Trace visible within ~2s                           |

## API unit/integration tests

```
pnpm --filter @audit-trail/api test
Test Suites: 9 passed, 9 total
Tests:       31 passed, 31 total
```

## Service URLs (default local)

| Service       | URL                                |
| ------------- | ---------------------------------- |
| API           | http://localhost:3100              |
| Health        | http://localhost:3100/health       |
| OpenAPI       | http://localhost:3100/openapi.yaml |
| Docs UI       | http://localhost:3100/docs         |
| Web           | http://localhost:5173              |
| Postgres      | localhost:15432                    |
| Redis         | localhost:16379                    |
| MinIO API     | localhost:19000                    |
| MinIO console | http://localhost:19001             |
