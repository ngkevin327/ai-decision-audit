# Local development runbook

Target: **< 30 minutes** from clone to verified ingest + UI.

## Prerequisites

| Tool           | Version            |
| -------------- | ------------------ |
| Node.js        | 20+ (see `.nvmrc`) |
| pnpm           | 9+                 |
| Docker Desktop | Running            |

## 1. One-command setup

```bash
pnpm setup:local
```

This will:

1. Copy `.env.example` → `.env` (if missing)
2. Start Docker (Postgres **15432**, Redis **16379**, MinIO **19000**)
3. `pnpm install --frozen-lockfile`
4. Prisma generate + migrate
5. Bootstrap local org, project, and ingest API key (`scripts/.local-dev-credentials.json`)

## 2. Start applications

```bash
pnpm dev
```

Runs API, worker, and web. If port **3000** is taken locally, the default API port is **3100** (see `.env` `PORT`).

| App    | Command (individual)                    | URL                    |
| ------ | --------------------------------------- | ---------------------- |
| API    | `pnpm --filter @audit-trail/api dev`    | http://localhost:3100  |
| Worker | `pnpm --filter @audit-trail/worker dev` | (background consumers) |
| Web    | `pnpm --filter @audit-trail/web dev`    | http://localhost:5173  |

Copy `apps/web/.env.example` → `apps/web/.env.local` (bootstrap also writes `VITE_DEFAULT_ORG_ID`).

## 3. Verify working product

```bash
pnpm verify:local
```

Expected: **5/5 checks passed** (health, OpenAPI, web, ingest, query).

Optional demo data for the UI:

```bash
pnpm seed:demo
```

Then open the web app, select the demo org/project, and browse traces.

## Environment variables

### Required (local)

| Variable           | Example                                                | Purpose         |
| ------------------ | ------------------------------------------------------ | --------------- |
| `DATABASE_URL`     | `postgresql://audit:audit@localhost:15432/audit_trail` | Postgres        |
| `REDIS_URL`        | `redis://localhost:16379`                              | BullMQ          |
| `STORAGE_DRIVER`   | `minio`                                                | Payload storage |
| `MINIO_ENDPOINT`   | `localhost`                                            | MinIO host      |
| `MINIO_PORT`       | `19000`                                                | MinIO API port  |
| `MINIO_ACCESS_KEY` | `minioadmin`                                           | MinIO           |
| `MINIO_SECRET_KEY` | `minioadmin`                                           | MinIO           |
| `MINIO_BUCKET`     | `audit-payloads`                                       | Bucket name     |
| `PORT`             | `3100`                                                 | API listen port |

Set by `pnpm bootstrap:local`:

| Variable                | Purpose                                        |
| ----------------------- | ---------------------------------------------- |
| `LOCAL_DEV_ORG_ID`      | Org UUID for scripts/UI                        |
| `LOCAL_DEV_PROJECT_ID`  | Project UUID for ingest                        |
| `LOCAL_DEV_API_KEY`     | Ingest/read/export key (plaintext, local only) |
| `EXPORT_SIGNING_SECRET` | Export manifest signing (dev default)          |

### Optional (local)

| Variable                                     | Purpose                                           |
| -------------------------------------------- | ------------------------------------------------- |
| `CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` | Real sign-in (API)                                |
| `VITE_CLERK_PUBLISHABLE_KEY`                 | Clerk in web (omit to use dev mode without login) |
| `VITE_API_BASE_URL`                          | Web → API (default http://localhost:3100)         |
| `VITE_DEFAULT_ORG_ID`                        | Trace explorer without Clerk                      |
| `VITE_DEV_USER_ID`                           | Dev user id for API calls from web                |
| `SENDGRID_API_KEY`                           | Export/quota emails (skipped if unset)            |
| `SENDGRID_FROM_EMAIL`                        | Sender address                                    |

### Required (staging / production only)

| Variable                                         | When                |
| ------------------------------------------------ | ------------------- |
| `STORAGE_DRIVER=s3` + `AWS_REGION` + `S3_BUCKET` | S3 payloads         |
| Strong `EXPORT_SIGNING_SECRET`                   | Export integrity    |
| Clerk keys                                       | Production UI auth  |
| `SENDGRID_*`                                     | Email notifications |

## How to verify (checklist)

- [ ] `docker compose ps` — postgres, redis, minio healthy
- [ ] `pnpm verify:local` — 5/5 passed
- [ ] Open http://localhost:3100/docs — Swagger UI loads
- [ ] Open http://localhost:5173 — trace explorer loads
- [ ] `pnpm seed:demo` — demo traces visible in UI
- [ ] `pnpm --filter @audit-trail/api test` — all green

## Ingest with bootstrap key

```bash
# Credentials: scripts/.local-dev-credentials.json
curl -s -X POST http://localhost:3100/v1/traces \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: $LOCAL_DEV_API_KEY" \
  -H "X-Project-Id: $LOCAL_DEV_PROJECT_ID" \
  -d @apps/api/test/fixtures/ingest-trace.json
```

## Tear down

```bash
pnpm deps:down
```

## Troubleshooting

| Symptom                            | Fix                                                                      |
| ---------------------------------- | ------------------------------------------------------------------------ |
| Port bind errors on 5432/6379/9000 | Use repo `docker-compose.yml` ports (15432/16379/19000)                  |
| API `EADDRINUSE` on 3000           | Set `PORT=3100` in `.env`, sync `apps/api/.env`                          |
| `DATABASE_URL` missing for Prisma  | Run commands via `pnpm db:migrate` (loads root `.env`)                   |
| Health returns 401                 | Pull latest; `/health` must be excluded from tenant middleware           |
| Worker crashes on MinIO bucket     | Harmless if bucket exists; latest code ignores `BucketAlreadyOwnedByYou` |
| `pnpm verify:local` ingest 409     | Re-run (script now uses unique event ids)                                |

See also: [local verification log](../verification/local-verification-log.md). (MVP gap/validation reports archived under gitignored `temp/docs/`.)
