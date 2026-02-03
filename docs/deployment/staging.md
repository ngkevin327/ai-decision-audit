# Staging deployment guide (AWS)

This guide covers deploying the AI Audit Trail MVP to a shared **staging** environment on AWS. Terraform under `infra/environments/staging` provisions RDS PostgreSQL and an S3 payload bucket; application services run on ECS Fargate (or equivalent container platform) in front of that stack.

## Prerequisites

- AWS account with permissions for RDS, S3, ECS, ECR, Secrets Manager, and IAM
- Terraform >= 1.6 with remote state bucket `audit-trail-terraform-state` and lock table `audit-trail-terraform-locks`
- Container images for `apps/api`, `apps/worker`, and static `apps/web` build
- Clerk application keys for the forensic web UI

## 1. Provision infrastructure

```bash
cd infra/environments/staging
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with bucket name, instance size, and tags
terraform init
terraform plan
terraform apply
```

Capture outputs:

- `rds_endpoint` — Postgres connection host
- `payload_bucket` — S3 bucket for offloaded event payloads and export ZIPs

## 2. Configure secrets

Store in AWS Secrets Manager (or SSM Parameter Store) and inject into ECS task definitions:

| Secret                                    | Purpose                                                  |
| ----------------------------------------- | -------------------------------------------------------- |
| `DATABASE_URL`                            | `postgresql://user:pass@{rds_endpoint}:5432/audit_trail` |
| `REDIS_URL`                               | ElastiCache Redis URL for BullMQ                         |
| `STORAGE_DRIVER`                          | `s3`                                                     |
| `AWS_REGION`, `S3_BUCKET`                 | Payload bucket from Terraform                            |
| `EXPORT_SIGNING_SECRET`                   | HMAC key for export manifests                            |
| `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL` | Export-ready and quota emails                            |
| `CLERK_*`                                 | Web authentication                                       |

Run migrations from a one-off task or CI job:

```bash
pnpm db:migrate
```

## 3. Deploy API and worker (ECS)

Recommended task layout:

| Service        | Image                 | Port | Notes                             |
| -------------- | --------------------- | ---- | --------------------------------- |
| `audit-api`    | `@audit-trail/api`    | 3000 | ALB health check `/health`        |
| `audit-worker` | `@audit-trail/worker` | —    | No ingress; consumes Redis queues |
| `audit-web`    | static Vite build     | 443  | CloudFront or ALB + S3 origin     |

Environment variables must match `.env.example`. Set `NODE_ENV=production` and disable MinIO.

Wire OpenAPI docs by calling `registerOpenApi(app)` from `apps/api/swagger.ts` in API bootstrap (serves `/openapi.yaml` and `/docs`).

## 4. Post-deploy smoke tests

```bash
curl -fsS https://api.staging.example.com/health
curl -fsS https://api.staging.example.com/openapi.yaml | head
# Ingest with staging API key
curl -X POST https://api.staging.example.com/v1/traces \
  -H "X-Api-Key: $STAGING_API_KEY" \
  -H "X-Project-Id: $PROJECT_ID" \
  -H "Content-Type: application/json" \
  -d @apps/api/test/fixtures/ingest-trace.json
```

Verify worker logs show indexer and export consumers started. Open the web UI and confirm trace search returns the ingested trace within one minute.

## 5. Seed demo data (optional)

```bash
DATABASE_URL=... pnpm exec tsx scripts/seed-demo-traces.ts
```

## 6. Rollback

- ECS: revert task definition to previous image digest
- Database: restore RDS snapshot (migrations are forward-only in MVP)
- Terraform: `terraform apply` with previous state pin

## Networking notes

- RDS security group should allow ingress only from ECS task security groups
- S3 bucket policy denies public access; presigned URLs serve exports and large payloads
- Enable TLS on the ALB; redirect HTTP to HTTPS

## Observability

- Ship container logs to CloudWatch Logs
- Alert on `/health` `degraded`, queue depth, and export job `failed` rate
- See [docs/runbooks/on-call.md](../runbooks/on-call.md) for incident steps
