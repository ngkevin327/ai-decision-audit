# Indexer DLQ Runbook

## Overview

Trace ingest ACKs return before indexing completes. The `indexer` BullMQ queue processes `TraceIndexJob` payloads asynchronously. Jobs retry three times with exponential backoff (1s base). Exhausted jobs are persisted to `index_job_dlq`.

## Symptoms

- Traces remain unsearchable (`indexed_at` is null) long after ingest
- Worker logs: `index job failed` followed by `index job moved to DLQ`
- `index_lag_seconds` metric stops updating for a tenant

## Inspect DLQ rows

```sql
SELECT id, trace_id, organization_id, attempt_count, error_message, failed_at
FROM index_job_dlq
ORDER BY failed_at DESC
LIMIT 50;
```

## Replay a failed job

1. Fix root cause (schema drift, missing trace row, hash mismatch, DB outage).
2. Re-enqueue manually:

```bash
curl -X POST http://localhost:3000/v1/traces \
  -H "X-Api-Key: $INGEST_KEY" \
  -H "Content-Type: application/json" \
  -d @trace-envelope.json
```

Or publish directly to Redis/BullMQ with the original `traceId` payload if the trace already exists.

3. Delete the DLQ row after successful re-index:

```sql
DELETE FROM index_job_dlq WHERE trace_id = '<uuid>';
```

## Hash chain mismatch

If `Event hash chain mismatch during indexing` appears, compare `events.content_hash` / `chain_hash` with a local recompute using `@audit-trail/integrity` golden vectors. Do not edit hashes in place; re-ingest the trace envelope.

## Escalation

- Sustained DLQ growth > 10 rows / 5 min: page platform on-call
- Index lag p95 > 60s for 15 min: check worker pod restarts and Postgres load
