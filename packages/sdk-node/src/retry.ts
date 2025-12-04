export interface RetryOptions {
  /** Maximum attempts including the first try (default 5). */
  maxAttempts?: number;
  /** Base delay in ms before the second attempt (default 250). */
  baseDelayMs?: number;
  /** Cap delay in ms (default 8000). */
  maxDelayMs?: number;
  /** Predicate deciding whether an error is retriable. */
  shouldRetry?: (error: unknown, attempt: number) => boolean;
}

const DEFAULT_MAX_ATTEMPTS = 5;

/**
 * Exponential backoff with full jitter for retriable HTTP failures.
 */
export async function withRetry<T>(
  operation: (attempt: number) => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  const baseDelayMs = options.baseDelayMs ?? 250;
  const maxDelayMs = options.maxDelayMs ?? 8000;
  const shouldRetry = options.shouldRetry ?? defaultShouldRetry;

  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await operation(attempt);
    } catch (error) {
      lastError = error;
      if (attempt >= maxAttempts || !shouldRetry(error, attempt)) {
        throw error;
      }
      const delay = computeDelayMs(attempt, baseDelayMs, maxDelayMs);
      await sleep(delay);
    }
  }
  throw lastError;
}

export function isRetriableHttpStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

function defaultShouldRetry(error: unknown): boolean {
  if (error instanceof HttpResponseError) {
    return isRetriableHttpStatus(error.status);
  }
  return true;
}

export class HttpResponseError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'HttpResponseError';
  }
}

function computeDelayMs(attempt: number, baseDelayMs: number, maxDelayMs: number): number {
  const exp = Math.min(maxDelayMs, baseDelayMs * 2 ** (attempt - 1));
  return Math.floor(Math.random() * exp);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
