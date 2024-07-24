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

```bash
pnpm install
pnpm dev
```

API health: `http://localhost:3000/health`  
Web UI: `http://localhost:5173`

Detailed setup (Docker Compose, env vars) is documented in later milestones.

## Build and test

```bash
pnpm build
pnpm lint
pnpm test
```

## Deployment

Staging infrastructure is defined under `infra/terraform`. Production rollout uses the same modules with environment-specific variables and remote state (S3 + DynamoDB lock table).
