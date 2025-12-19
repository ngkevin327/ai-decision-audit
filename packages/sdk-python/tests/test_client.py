from __future__ import annotations

import json
from unittest.mock import MagicMock, patch

from audit_trail.client import AuditTrailClient
from audit_trail.redact import redact_secrets
from audit_trail.transport import BufferedTransport


def test_client_flushes_trace_envelope():
    posted: list[dict] = []

    def fake_post(envelope: dict) -> None:
        posted.append(envelope)

    client = AuditTrailClient(
        api_key="at_test",
        project_id="proj_1",
        base_url="http://localhost:3000",
        sink=BufferedTransport(
            api_key="at_test",
            project_id="proj_1",
            base_url="http://localhost:3000",
            flush_interval_ms=60_000,
            post_fn=fake_post,
        ),
    )

    trace = client.trace(
        "support_flow",
        actor={"actor_id": "u1", "actor_type": "user"},
        permission_snapshot={"policy_version": "1", "roles": [], "scopes": []},
    )
    trace.span("main")
    trace.complete()
    client.flush()

    assert len(posted) == 1
    assert posted[0]["workflow_name"] == "support_flow"


def test_redact_authorization_header():
    payload = redact_secrets(
        {"headers": {"Authorization": "Bearer secret", "Content-Type": "application/json"}}
    )
    assert payload["headers"]["Authorization"] == "[REDACTED]"


@patch("urllib.request.urlopen")
def test_buffered_transport_retries_retriable_errors(mock_urlopen: MagicMock):
    responses = [
        _http_error(503),
        _http_error(503),
        MagicMock(status=202),
    ]
    mock_urlopen.side_effect = responses

    transport = BufferedTransport(
        api_key="at_test",
        project_id="proj",
        base_url="http://localhost:3000",
        flush_interval_ms=60_000,
    )
    transport.enqueue(
        {
            "schema_version": "1.0",
            "trace_id": "tr_retry",
            "workflow_name": "wf",
            "actor": {"actor_id": "a", "actor_type": "user"},
            "permission_snapshot": {"policy_version": "1", "roles": [], "scopes": []},
            "started_at": "2026-05-19T00:00:00Z",
            "spans": [],
        }
    )
    transport.flush()
    assert mock_urlopen.call_count >= 2


def _http_error(code: int):
    import urllib.error

    return urllib.error.HTTPError(
        url="http://localhost:3000/v1/traces",
        code=code,
        msg="error",
        hdrs=None,
        fp=None,
    )
