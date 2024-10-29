# Event Schema v1

Schema version: `1.0`  
Package: `@audit-trail/schema`

## Event types

| Type         | Purpose               | Required payload fields                |
| ------------ | --------------------- | -------------------------------------- |
| `prompt`     | Model input messages  | `messages[]`                           |
| `completion` | Model output          | `content`                              |
| `tool_call`  | Tool invocation       | `tool_name`, optional `input`/`output` |
| `retrieval`  | RAG chunks            | `chunks[]`                             |
| `approval`   | Human/policy decision | `decision`                             |
| `custom`     | Extension point       | `name`, `data`                         |

## Trace ingest envelope

Every ingest request wraps one or more spans:

```json
{
  "schema_version": "1.0",
  "trace_id": "tr_…",
  "workflow_name": "support_refund",
  "actor": { "actor_id": "user_1", "actor_type": "user" },
  "permission_snapshot": {
    "policy_version": "2026.05.1",
    "roles": ["developer"],
    "scopes": ["trace:ingest"]
  },
  "started_at": "2026-05-19T14:31:55Z",
  "spans": [{ "span_id": "span_1", "name": "main", "events": [] }]
}
```

`permission_snapshot` is required on every trace (PRD F5).

## Validation

```typescript
import { getSchemaValidator } from '@audit-trail/schema';

const result = getSchemaValidator().validateTraceEnvelope(payload);
if (!result.valid) {
  console.error(result.errors);
}
```

## Versioning

See [ADR-001](../adr/001-schema-versioning.md). Breaking changes require a new schema folder (`schemas/v2/`).
