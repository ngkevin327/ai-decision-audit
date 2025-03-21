# Ingest API

## POST /v1/traces

Accepts a trace ingest envelope (schema v1) and returns `202 Accepted` when the trace is persisted and queued for indexing.

### Authentication

- Header: `X-Api-Key: at_live_…`
- Required scope: `trace:ingest`
- API key must be scoped to a project (and optionally environment)

### Headers

| Header            | Required | Description                     |
| ----------------- | -------- | ------------------------------- |
| `X-Api-Key`       | Yes      | Project-scoped ingest key       |
| `Idempotency-Key` | No       | Replays return the original ACK |
| `Content-Type`    | Yes      | `application/json`              |

### Response `202`

```json
{
  "trace_id": "tr_…",
  "received_at": "2026-05-19T14:32:00.000Z"
}
```

`received_at` uses server time (client `started_at` is stored separately on the trace record).

### Error codes

| HTTP | Code                           | When                                              |
| ---- | ------------------------------ | ------------------------------------------------- |
| 400  | `VALIDATION_ERROR`             | JSON Schema failure (includes `errors[].pointer`) |
| 400  | `PERMISSION_SNAPSHOT_REQUIRED` | Missing permission block                          |
| 401  | —                              | Missing/invalid API key                           |
| 403  | —                              | Missing `trace:ingest` scope                      |
| 409  | —                              | Duplicate `event_id` for tenant                   |
| 413  | `PAYLOAD_TOO_LARGE`            | Body > 5MB                                        |
| 429  | `RATE_LIMITED`                 | Per-key token bucket exceeded (`Retry-After: 1`)  |

### Payload offload

Event `payload` objects larger than 64KB are stored in object storage; the database row stores `payload_ref` only.

### Idempotency

- Duplicate `event_id` values within a tenant return the existing trace ACK (unique DB constraint).
- `Idempotency-Key` header caches the full HTTP response for safe SDK retries.

OpenAPI: [`apps/api/openapi.yaml`](../../apps/api/openapi.yaml)
