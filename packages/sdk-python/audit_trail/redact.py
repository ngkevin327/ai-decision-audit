from __future__ import annotations

from copy import deepcopy
from typing import Any

SENSITIVE_KEYS = {
    "authorization",
    "x-api-key",
    "api_key",
    "apikey",
    "password",
    "secret",
    "token",
}

REDACTED = "[REDACTED]"


def redact_secrets(value: Any) -> Any:
    return _redact(value)


def _redact(value: Any) -> Any:
    if value is None or isinstance(value, (bool, int, float, str)):
        return value
    if isinstance(value, list):
        return [_redact(item) for item in value]
    if isinstance(value, dict):
        result: dict[str, Any] = {}
        for key, nested in value.items():
            lower = key.lower()
            if lower in SENSITIVE_KEYS:
                result[key] = REDACTED
            elif lower == "headers" and isinstance(nested, dict):
                result[key] = {
                    k: REDACTED if k.lower() in SENSITIVE_KEYS else _redact(v)
                    for k, v in nested.items()
                }
            else:
                result[key] = _redact(nested)
        return result
    return deepcopy(value)
