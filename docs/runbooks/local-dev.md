# Local development runbook

## Prerequisites

- Node.js 20 (`nvm use`)
- pnpm 9+
- Docker Desktop

## Start dependencies

```bash
docker compose up -d
```

Services:

| Service  | Port | Purpose              |
|----------|------|----------------------|
| Postgres | 5432 | Metadata database    |
| Redis    | 6379 | BullMQ job queue     |
| MinIO    | 9000 | Payload object store |

MinIO console: http://localhost:9001 (minioadmin / minioadmin)

## Configure environment

```bash
cp .env.example .env
```

Adjust `DATABASE_URL` or bucket names if ports conflict with other projects.

## Install and migrate

```bash
pnpm install
pnpm db:generate
pnpm db:migrate
```

## Run applications

```bash
pnpm dev
```

| App    | URL                         |
|--------|-----------------------------|
| API    | http://localhost:3000/health |
| Web UI | http://localhost:5173        |

## Verify dependencies

A healthy API returns `status: "ok"` with database, storage, and queue probes up:

```bash
curl -s http://localhost:3000/health | jq
```

## Worker

```bash
pnpm --filter @audit-trail/worker dev
```

Expect log line confirming database and queue connectivity.

## Tear down

```bash
docker compose down
```
