const SENSITIVE_KEYS = new Set([
  'authorization',
  'x-api-key',
  'api_key',
  'apikey',
  'password',
  'secret',
  'token',
]);

const REDACTED = '[REDACTED]';

/**
 * Deep-clone and redact sensitive header and credential fields.
 */
export function redactSecrets<T>(value: T): T {
  return redactValue(value) as T;
}

function redactValue(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => redactValue(item));
  }
  if (typeof value !== 'object') {
    return value;
  }
  const record = value as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(record)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      result[key] = REDACTED;
      continue;
    }
    if (key.toLowerCase() === 'headers' && nested && typeof nested === 'object') {
      result[key] = redactHeaders(nested as Record<string, unknown>);
      continue;
    }
    result[key] = redactValue(nested);
  }
  return result;
}

function redactHeaders(headers: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(headers)) {
    out[key] = SENSITIVE_KEYS.has(key.toLowerCase()) ? REDACTED : redactValue(val);
  }
  return out;
}
