from __future__ import annotations

import json
import time
import urllib.error
import urllib.request
from dataclasses import dataclass, field
from typing import Any, Callable, Optional, Protocol


class TraceSink(Protocol):
    def enqueue(self, envelope: dict[str, Any]) -> None: ...
    def flush(self) -> None: ...


@dataclass
class AuditTrailClient:
    api_key: str
    project_id: str
    environment: Optional[str] = None
    base_url: str = "http://localhost:3000"
    sink: Optional[TraceSink] = None
    _pending: list[dict[str, Any]] = field(default_factory=list, init=False, repr=False)

    def trace(
        self,
        workflow_name: str,
        *,
        actor: dict[str, Any],
        permission_snapshot: dict[str, Any],
        tags: Optional[dict[str, str]] = None,
        environment: Optional[str] = None,
    ) -> "ActiveTrace":
        envelope: dict[str, Any] = {
            "schema_version": "1.0",
            "trace_id": f"tr_{_random_id()}",
            "workflow_name": workflow_name,
            "environment": environment or self.environment,
            "actor": actor,
            "permission_snapshot": permission_snapshot,
            "started_at": _utc_now(),
            "status": "in_progress",
            "tags": tags,
            "spans": [],
        }
        self._sync(envelope)
        return ActiveTrace(envelope, on_change=lambda: self._sync(envelope))

    def flush(self) -> None:
        if self.sink is not None:
            self.sink.flush()
            return
        batch = self._pending[:]
        self._pending.clear()
        for envelope in batch:
            self._post(envelope)

    def _sync(self, envelope: dict[str, Any]) -> None:
        if self.sink is not None:
            self.sink.enqueue(envelope)
            return
        for idx, existing in enumerate(self._pending):
            if existing["trace_id"] == envelope["trace_id"]:
                self._pending[idx] = envelope
                return
        self._pending.append(envelope)

    def _post(self, envelope: dict[str, Any]) -> None:
        data = json.dumps(envelope).encode("utf-8")
        request = urllib.request.Request(
            f"{self.base_url}/v1/traces",
            data=data,
            method="POST",
            headers={
                "Content-Type": "application/json",
                "X-Api-Key": self.api_key,
                "X-Project-Id": self.project_id,
                "Idempotency-Key": envelope["trace_id"],
            },
        )
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                if response.status not in (200, 202):
                    raise RuntimeError(f"Ingest failed ({response.status})")
        except urllib.error.HTTPError as exc:
            raise RuntimeError(f"Ingest failed ({exc.code}): {exc.read().decode()}") from exc


@dataclass
class ActiveTrace:
    envelope: dict[str, Any]
    on_change: Callable[[], None]

    def span(self, name: str, parent_span_id: Optional[str] = None) -> "ActiveSpan":
        span = {
            "span_id": f"span_{_random_id()}",
            "parent_span_id": parent_span_id,
            "name": name,
            "events": [],
        }
        self.envelope["spans"].append(span)
        self.on_change()
        return ActiveSpan(self.envelope, span, self.on_change)

    def complete(self) -> None:
        self.envelope["status"] = "completed"
        self.on_change()

    def fail(self) -> None:
        self.envelope["status"] = "failed"
        self.on_change()


@dataclass
class ActiveSpan:
    envelope: dict[str, Any]
    span: dict[str, Any]
    on_change: Callable[[], None]

    @property
    def span_id(self) -> str:
        return self.span["span_id"]

    def add_event(self, event: dict[str, Any]) -> None:
        self.span["events"].append(event)
        self.on_change()


def _random_id() -> str:
    return f"{int(time.time() * 1000):x}_{int(time.time() * 1e6) % 1_000_000:06x}"


def _utc_now() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
