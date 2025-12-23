# Python SDK quickstart

Install:

```bash
pip install audit-trail
```

First trace:

```python
from audit_trail.client import AuditTrailClient
from audit_trail.transport import BufferedTransport

sink = BufferedTransport(
    api_key="at_your_key",
    project_id="proj_123",
    base_url="http://localhost:3000",
)

client = AuditTrailClient(
    api_key="at_your_key",
    project_id="proj_123",
    environment="staging",
    sink=sink,
)

trace = client.trace(
    "support_refund",
    actor={"actor_id": "user_42", "actor_type": "user"},
    permission_snapshot={
        "policy_version": "2026.05.1",
        "roles": ["support_agent"],
        "scopes": ["refunds:approve"],
    },
)
span = trace.span("refund_flow")
span.add_event(
    {
        "schema_version": "1.0",
        "event_id": "evt_1",
        "type": "prompt",
        "occurred_at": "2026-05-19T14:31:58Z",
        "span_id": span.span_id,
        "payload": {"messages": [{"role": "user", "content": "Approve refund"}]},
    }
)
trace.complete()
client.flush()
sink.shutdown()
```

Anthropic helper:

```python
from audit_trail.integrations.anthropic import wrap_anthropic_messages

traced_create = wrap_anthropic_messages(client, anthropic.messages.create, span)
traced_create(model="claude-sonnet-4-20250514", max_tokens=256, messages=[])
```

Sensitive headers such as `Authorization` are redacted before upload.
