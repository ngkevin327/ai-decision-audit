# AI Audit Trail Platform

Git-like audit and replay for AI copilots in SaaS products. Captures prompts, retrieved context, tool calls, model versions, and permission snapshots so teams can explain and reproduce AI decisions.

## Target users

- Engineering teams shipping customer-facing AI assistants
- Compliance and ops leads in regulated verticals (fintech, health, legal)
- On-call engineers debugging misrouted or incorrect AI outcomes

## Architecture overview

| Component                      | Role                                             |
| ------------------------------ | ------------------------------------------------ |
| `apps/api`                     | Ingest, query, exports, control plane (NestJS)   |
| `apps/worker`                  | Indexing, export packaging, retention compaction |
| `apps/web`                     | Forensic trace explorer (React)                  |
| `packages/schema`              | Shared event types and JSON Schema               |
| `packages/sdk-node`            | `@audit-trail/sdk` npm package                   |
| `packages/sdk-python`          | `audit-trail` PyPI package                       |
| `examples/copilot-support-bot` | Reference SDK integration                        |

Event flow: SDK → `POST /v1/traces` → Redis queue → indexer → Postgres + object storage → query/replay APIs → web UI.

## Requirements

- Node.js 20 LTS (see `.nvmrc`)
- pnpm 9+
- Docker Desktop (Postgres, Redis, MinIO)

## Quickstart (≈30 minutes to first trace)

### 1. Start dependencies

```bash
cp .env.example .env
docker compose up -d
pnpm install
pnpm db:generate
pnpm db:migrate
```

### 2. Run the stack

```bash
pnpm dev
```

| Service     | URL                                |
| ----------- | ---------------------------------- |
| API health  | http://localhost:3000/health       |
| OpenAPI     | http://localhost:3000/openapi.yaml |
| API docs UI | http://localhost:3000/docs         |
| Web UI      | http://localhost:5173              |

Wire OpenAPI in API bootstrap: `import { registerOpenApi } from './swagger'; registerOpenApi(app);` (see `apps/api/swagger.ts`).

### 3. Ingest a trace (SDK)

```bash
export AUDIT_TRAIL_API_KEY=at_your_key
export AUDIT_TRAIL_PROJECT_ID=your_project_uuid
pnpm --filter copilot-support-bot start
```

Or use the refund demo scenario:

```bash
pnpm exec tsx examples/copilot-support-bot/src/scenarios/refund.ts
```

### 4. View in the UI

Open http://localhost:5173, select your project, and search traces. Use **Exports** for auditor packages and **Billing** for quota usage.

### 5. Seed demo data (optional)

```bash
pnpm exec tsx scripts/seed-demo-traces.ts
```

## Build and test

```bash
pnpm build
pnpm lint
pnpm test
```

Integration tests require Postgres and Redis (see `.github/workflows/integration.yml`).

## Documentation

| Doc                                                                    | Description          |
| ---------------------------------------------------------------------- | -------------------- |
| [docs/sdk/node-quickstart.md](./docs/sdk/node-quickstart.md)           | Node SDK             |
| [docs/sdk/python-quickstart.md](./docs/sdk/python-quickstart.md)       | Python SDK           |
| [docs/export-format.md](./docs/export-format.md)                       | Export ZIP layout    |
| [docs/pricing-plans.md](./docs/pricing-plans.md)                       | Retention and quotas |
| [docs/deployment/staging.md](./docs/deployment/staging.md)             | AWS staging deploy   |
| [docs/api/postman-collection.json](./docs/api/postman-collection.json) | Postman collection   |
| [docs/runbooks/on-call.md](./docs/runbooks/on-call.md)                 | Incident response    |

## Environment variables

See [.env.example](./.env.example) for `DATABASE_URL`, `REDIS_URL`, storage, Clerk, SendGrid, and `EXPORT_SIGNING_SECRET`.

## Deployment

Terraform modules live under `infra/environments/staging`. See [docs/deployment/staging.md](./docs/deployment/staging.md) for RDS, S3, and ECS rollout steps.
