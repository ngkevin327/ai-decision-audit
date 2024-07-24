# ADR-000: Technology Stack

**Status:** Accepted  
**Date:** 2026-05-19

## Context

The MVP targets small and mid-sized teams shipping AI copilots who need audit-grade trace capture, replay, and export without operating a full governance suite.

## Decision

| Layer | Choice | Rationale |
|-------|--------|-----------|
| API | NestJS (TypeScript) | Mature DI, modular boundaries, strong typing for multi-tenant guards |
| Worker | TypeScript (NestJS shared modules) | Reuse domain services with API; async jobs off request path |
| Web | React 18 + Vite | Fast local dev; component ecosystem for forensic UI |
| Database | PostgreSQL 15 + Prisma | Relational metadata, migrations, tenant-scoped queries |
| Queue (local) | BullMQ on Redis | Low-friction local dev; adapter to SQS for staging |
| Object storage | S3-compatible (MinIO local, S3 staging) | Offload large payloads from Postgres |
| IaC | Terraform | Staging/prod parity; remote state on S3 + DynamoDB lock |
| Monorepo | pnpm workspaces + Turborepo | Shared schema package and coordinated releases |

## Consequences

- Engineers run dependencies via Docker Compose before cloud accounts.
- Ingest and indexer workers share queue and storage abstractions.
- Enterprise features (dedicated VPC, CMK) extend Terraform modules without replacing core services.
