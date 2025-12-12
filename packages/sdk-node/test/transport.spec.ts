import type { TraceIngestEnvelope } from '@audit-trail/schema';
import { HttpResponseError, withRetry } from '../src/retry';
import { BufferedTransport } from '../src/transport';

describe('withRetry', () => {
  it('retries retriable http errors up to max attempts', async () => {
    let attempts = 0;
    await expect(
      withRetry(
        async () => {
          attempts += 1;
          if (attempts < 3) {
            throw new HttpResponseError(503, 'unavailable');
          }
          return 'ok';
        },
        { maxAttempts: 5, baseDelayMs: 1, maxDelayMs: 2 },
      ),
    ).resolves.toBe('ok');
    expect(attempts).toBe(3);
  });
});

describe('BufferedTransport', () => {
  it('flushes when buffer exceeds max size', async () => {
    const fetchMock = jest.fn(async () => new Response('{}', { status: 202 }));
    global.fetch = fetchMock as typeof fetch;

    const transport = new BufferedTransport({
      apiKey: 'at_key',
      projectId: 'proj',
      baseUrl: 'http://localhost:3000',
      maxBufferSize: 2,
      flushIntervalMs: 60_000,
    });

    const envelope = (id: string): TraceIngestEnvelope => ({
      schema_version: '1.0',
      trace_id: id,
      workflow_name: 'wf',
      actor: { actor_id: 'a', actor_type: 'user' },
      permission_snapshot: { policy_version: '1', roles: [], scopes: [] },
      started_at: new Date().toISOString(),
      spans: [],
    });

    transport.enqueue(envelope('tr_1'));
    transport.enqueue(envelope('tr_2'));
    await new Promise((r) => setTimeout(r, 10));
    await transport.shutdown();

    expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(2);
  });
});
