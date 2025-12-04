import type { TraceIngestEnvelope } from '@audit-trail/schema';
import { HttpResponseError, isRetriableHttpStatus, withRetry } from './retry';

export interface BufferedTransportConfig {
  apiKey: string;
  projectId: string;
  baseUrl?: string;
  /** Flush at least every N ms (default 2000). */
  flushIntervalMs?: number;
  /** Flush when buffer reaches this size (default 50). */
  maxBufferSize?: number;
  fetchImpl?: typeof fetch;
}

export interface TraceSink {
  enqueue(envelope: TraceIngestEnvelope): void;
  flush(): Promise<void>;
  shutdown(): Promise<void>;
}

/**
 * Buffers trace envelopes and flushes to POST /v1/traces with retry + jitter.
 */
export class BufferedTransport implements TraceSink {
  private readonly config: Required<
    Pick<BufferedTransportConfig, 'baseUrl' | 'flushIntervalMs' | 'maxBufferSize'>
  > &
    BufferedTransportConfig;
  private readonly fetchImpl: typeof fetch;
  private readonly buffer: TraceIngestEnvelope[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;
  private flushing = false;

  constructor(config: BufferedTransportConfig) {
    this.config = {
      ...config,
      baseUrl: config.baseUrl ?? 'http://localhost:3000',
      flushIntervalMs: config.flushIntervalMs ?? 2000,
      maxBufferSize: config.maxBufferSize ?? 50,
    };
    this.fetchImpl = config.fetchImpl ?? fetch;
    this.timer = setInterval(() => {
      void this.flush();
    }, this.config.flushIntervalMs);
  }

  enqueue(envelope: TraceIngestEnvelope): void {
    const sanitized = maybeRedact(envelope);
    const idx = this.buffer.findIndex((t) => t.trace_id === sanitized.trace_id);
    if (idx >= 0) {
      this.buffer[idx] = sanitized;
    } else {
      this.buffer.push(sanitized);
    }
    if (this.buffer.length >= this.config.maxBufferSize) {
      void this.flush();
    }
  }

  async flush(): Promise<void> {
    if (this.flushing || this.buffer.length === 0) {
      return;
    }
    this.flushing = true;
    const batch = this.buffer.splice(0, this.buffer.length);
    try {
      for (const envelope of batch) {
        await this.sendOne(envelope);
      }
    } finally {
      this.flushing = false;
    }
  }

  async shutdown(): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    await this.flush();
  }

  private async sendOne(envelope: TraceIngestEnvelope): Promise<void> {
    await withRetry(async () => {
      const response = await this.fetchImpl(`${this.config.baseUrl}/v1/traces`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': this.config.apiKey,
          'X-Project-Id': this.config.projectId,
          'Idempotency-Key': envelope.trace_id,
        },
        body: JSON.stringify(envelope),
      });
      if (!response.ok && response.status !== 202) {
        const body = await response.text();
        throw new HttpResponseError(response.status, `Ingest failed (${response.status}): ${body}`);
      }
    });
  }
}

export function isRetriableStatus(status: number): boolean {
  return isRetriableHttpStatus(status);
}

function maybeRedact(envelope: TraceIngestEnvelope): TraceIngestEnvelope {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { redactSecrets } = require('./redact') as typeof import('./redact');
    return redactSecrets(envelope);
  } catch {
    return envelope;
  }
}
