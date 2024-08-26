# AI Audit Trail Platform

Git-like audit and replay for AI copilots in SaaS products. Captures prompts, retrieved context, tool calls, model versions, and permission snapshots so teams can explain and reproduce AI decisions.

## Target users

- Engineering teams shipping customer-facing AI assistants
- Compliance and ops leads in regulated verticals (fintech, health, legal)
- On-call engineers debugging misrouted or incorrect AI outcomes

## Architecture overview

| Component | Role |
|-----------|------|
| `apps/api` | Ingest, query, control plane (NestJS) |
| `apps/worker` | Indexing, export, retention jobs |
| `apps/web` | Forensic trace explorer (React) |
| `packages/schema` | Shared event types and JSON Schema |
| `infra/terraform` | Staging and production infrastructure |

Event flow: SDK/proxy ingest → queue → indexer → Postgres metadata + object storage payloads → query/replay APIs → web UI.

## Requirements

- Node.js 20 LTS (see `.nvmrc`)
- pnpm 9+
- Docker Desktop (local dependencies)

## Local development

1. Copy environment template: `cp .env.example .env`
2. Start dependencies: `docker compose up -d`
3. Install and migrate:

```bash
pnpm install
pnpm db:generate
pnpm db:migrate
```

4. Run all apps: `pnpm dev`

| Service | Endpoint |
|---------|----------|
| API health | http://localhost:3000/health |
| Web UI | http://localhost:5173 |

See [docs/runbooks/local-dev.md](./docs/runbooks/local-dev.md) for troubleshooting and worker startup.

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `REDIS_URL` | Yes | Redis URL for BullMQ |
| `STORAGE_DRIVER` | No | `minio` (default) or `s3` |
| `MINIO_*` | When local | MinIO endpoint and credentials |
| `AWS_REGION`, `S3_BUCKET` | When `s3` | Staging/production blob storage |

Full list: [.env.example](./.env.example)

## Build and test

```bash
pnpm build
pnpm lint
pnpm test
```

Integration tests use Postgres and Redis (see `.github/workflows/integration.yml`).

## Deployment

Staging infrastructure is defined under `infra/terraform`. Configure remote state (S3 + DynamoDB lock), then:

```bash
cd infra/environments/staging
terraform init
terraform plan -var-file=terraform.tfvars
```

Production uses the same modules with environment-specific variables and stricter network controls.
