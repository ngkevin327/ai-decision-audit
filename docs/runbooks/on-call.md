# On-call incident response runbook

Quick reference for engineers responding to staging or production incidents for the AI Audit Trail platform.

## Severity guide

| Sev | Example                         | Target response    |
| --- | ------------------------------- | ------------------ |
| S1  | Ingest down for all tenants     | 15 min acknowledge |
| S2  | Query errors, export backlog    | 1 hour             |
| S3  | Elevated latency, single tenant | Next business day  |

## First 5 minutes

1. Acknowledge the page in PagerDuty / Slack `#incidents`
2. Check `GET /health` — note `status` and `dependencies` (database, storage, queue)
3. Check CloudWatch (or host metrics) for API 5xx rate, worker restarts, RDS CPU
4. Assign **Incident Commander** and open a shared doc with timeline

## Common scenarios

### Ingest returning 5xx or 429

- **429 quota:** expected when org exceeds monthly limit — confirm `GET /v1/quota` for tenant
- **429 rate limit:** edge middleware — identify abusive API key, throttle or revoke key
- **5xx:** inspect API logs for Prisma/Redis/MinIO errors; verify `DATABASE_URL` and `REDIS_URL`

### Traces missing in UI

- Confirm ingest returned `202` with `trace_id`
- Check worker logs for `indexer consumer started` and hash chain errors
- Query DB: trace row exists? `indexed_at` set? retention filter hiding old traces?

### Export jobs stuck in `processing`

- Inspect Redis queue `export` depth
- Worker logs for `export consumer` failures (storage upload, manifest build)
- Failed jobs: read `error_message` on `export_jobs` row

### Database connection exhaustion

- Scale API task count down temporarily
- Increase RDS `max_connections` or pool size (see Stage 12 perf notes)
- Look for long-running transactions in ingest path

## Safe mitigation actions

- Restart **worker** tasks (idempotent consumers; jobs retry)
- Restart **API** tasks behind load balancer
- Disable abusive API key via control plane (revoke key)
- Scale ECS service desired count +1

## Do not (without IC approval)

- `terraform destroy` or manual RDS delete
- Force-push git or amend production migrations
- Disable auth middleware globally

## Communication template

```
[Incident] AI Audit Trail — <short title>
Impact: <ingest|query|exports|all> — <staging|prod>
Start: <UTC time>
Current: Investigating / Mitigated / Resolved
Next update: <time>
```

## Post-incident

- Write a brief postmortem within 48h (timeline, root cause, action items)
- Link related commits and monitoring gaps
- Update this runbook if a new failure mode was discovered

## Escalation

- **Security / data leak suspicion:** freeze affected API keys, notify security lead
- **Legal / export request:** loop in compliance contact before sharing customer data
