# Ingest load test results

Baseline recorded from `scripts/k6/ingest-load.js` against the MVP stack. Re-run after performance commits (C12.1, C12.2) to compare.

## Target (PRD §18)

| Metric     | Target                                        |
| ---------- | --------------------------------------------- |
| Throughput | 5,000 ingest requests/sec sustained 5 minutes |
| p95 ACK    | < 200 ms (single-trace envelope, 1 event)     |
| Error rate | < 1%                                          |

## Test environment

| Item       | Value                                                                         |
| ---------- | ----------------------------------------------------------------------------- |
| Hardware   | Local dev / CI runner (document actual host when running)                     |
| API        | `@audit-trail/api` with worker + Redis + Postgres 16                          |
| k6 command | `k6 run scripts/k6/ingest-load.js`                                            |
| Env        | `API_URL`, `INGEST_API_KEY`, `PROJECT_ID`, optional `TARGET_RATE`, `DURATION` |

## Baseline run (MVP post C12.1/C12.2)

| Metric          | Result           | Notes                                                      |
| --------------- | ---------------- | ---------------------------------------------------------- |
| Sustained req/s | _fill after run_ | Use `http_reqs` rate from k6 summary                       |
| p95 latency     | _fill after run_ | Dominated by DB transaction + payload offload              |
| p99 latency     | _fill after run_ |                                                            |
| Check pass rate | _fill after run_ | Expect 202 + `trace_id` body                               |
| Bottleneck      | _fill after run_ | Typical: DB pool, serial span/event inserts, MinIO offload |

## Observations

1. **Connection pool** — `PrismaService` sets `connection_limit=20` and `pool_timeout=10` on `DATABASE_URL` when unset.
2. **Ingest ACK path** — payload offloads run in parallel; index jobs enqueue asynchronously after HTTP 202.
3. **Indexes** — migration `0011_perf_indexes` adds composite indexes for search filters and monthly quota `event` counts.

## Recommended production sizing (initial)

| Component    | Starter guidance                                 |
| ------------ | ------------------------------------------------ |
| API tasks    | 2+ replicas behind ALB                           |
| Worker tasks | 2+ replicas for indexer + export queues          |
| RDS          | `db.r6g.large` or larger for >1k req/s sustained |
| Redis        | Dedicated ElastiCache node for BullMQ            |

## Re-run checklist

```bash
docker compose up -d
pnpm db:migrate
pnpm dev
export API_URL=http://localhost:3000
export INGEST_API_KEY=at_your_key
export PROJECT_ID=your_project_uuid
k6 run -e TARGET_RATE=500 -e DURATION=2m scripts/k6/ingest-load.js
```

Document results in the table above before beta announce. If sustained 5k req/s is not met, record the measured ceiling and scale-out plan (no blocker for beta if p95 meets SLA at expected partner volume).
