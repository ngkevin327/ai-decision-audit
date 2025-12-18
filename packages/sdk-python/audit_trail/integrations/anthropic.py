from __future__ import annotations

from typing import Any, Callable

from ..client import ActiveSpan, AuditTrailClient
from ..redact import redact_secrets


def wrap_anthropic_messages(
    client: AuditTrailClient,
    create_fn: Callable[..., Any],
    span: ActiveSpan,
) -> Callable[..., Any]:
    def traced_create(*args: Any, **kwargs: Any) -> Any:
        params = kwargs if kwargs else (args[0] if args else {})
        span.add_event(
            {
                "schema_version": "1.0",
                "event_id": f"evt_{span.span_id}_prompt",
                "type": "prompt",
                "occurred_at": _utc_now(),
                "span_id": span.span_id,
                "payload": redact_secrets(params if isinstance(params, dict) else {"args": params}),
            }
        )
        result = create_fn(*args, **kwargs)
        span.add_event(
            {
                "schema_version": "1.0",
                "event_id": f"evt_{span.span_id}_completion",
                "type": "completion",
                "occurred_at": _utc_now(),
                "span_id": span.span_id,
                "payload": redact_secrets(result if isinstance(result, dict) else {"result": result}),
            }
        )
        client.flush()
        return result

    return traced_create


def _utc_now() -> str:
    import time

    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
