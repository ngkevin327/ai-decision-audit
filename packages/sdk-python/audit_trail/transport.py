from __future__ import annotations

import json
import random
import threading
import time
import urllib.error
import urllib.request
from typing import Any, Callable, Optional

from .redact import redact_secrets

RETRIABLE_STATUS = {429, 500, 502, 503, 504}


class BufferedTransport:
    def __init__(
        self,
        *,
        api_key: str,
        project_id: str,
        base_url: str = "http://localhost:3000",
        flush_interval_ms: int = 2000,
        max_buffer_size: int = 50,
        post_fn: Optional[Callable[[dict[str, Any]], None]] = None,
    ) -> None:
        self.api_key = api_key
        self.project_id = project_id
        self.base_url = base_url.rstrip("/")
        self.max_buffer_size = max_buffer_size
        self._post_fn = post_fn or self._default_post
        self._buffer: list[dict[str, Any]] = []
        self._lock = threading.Lock()
        self._timer = threading.Timer(flush_interval_ms / 1000.0, self._tick)
        self._timer.daemon = True
        self._timer.start()

    def enqueue(self, envelope: dict[str, Any]) -> None:
        sanitized = redact_secrets(envelope)
        with self._lock:
            for idx, existing in enumerate(self._buffer):
                if existing["trace_id"] == sanitized["trace_id"]:
                    self._buffer[idx] = sanitized
                    break
            else:
                self._buffer.append(sanitized)
            should_flush = len(self._buffer) >= self.max_buffer_size
        if should_flush:
            self.flush()

    def flush(self) -> None:
        with self._lock:
            batch = self._buffer[:]
            self._buffer.clear()
        for envelope in batch:
            self._send_with_retry(envelope)

    def shutdown(self) -> None:
        self._timer.cancel()
        self.flush()

    def _tick(self) -> None:
        self.flush()

    def _send_with_retry(self, envelope: dict[str, Any], max_attempts: int = 5) -> None:
        delay = 0.25
        for attempt in range(1, max_attempts + 1):
            try:
                self._post_fn(envelope)
                return
            except RuntimeError as exc:
                if attempt >= max_attempts or not _is_retriable(str(exc)):
                    raise
                time.sleep(random.uniform(0, min(8.0, delay)))
                delay = min(8.0, delay * 2)

    def _default_post(self, envelope: dict[str, Any]) -> None:
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
            if exc.code in RETRIABLE_STATUS:
                raise RuntimeError(f"retriable {exc.code}") from exc
            raise RuntimeError(f"Ingest failed ({exc.code})") from exc


def _is_retriable(message: str) -> bool:
    return "retriable" in message or "429" in message or "503" in message
