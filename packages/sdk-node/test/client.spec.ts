import { AuditTrailClient } from '../src/client';
import { promptEvent } from '../src/events';
import { BufferedTransport } from '../src/transport';

describe('AuditTrailClient', () => {
  it('starts a trace and flushes via direct ingest', async () => {
    const calls: RequestInit[] = [];
    global.fetch = jest.fn(async (_url, init) => {
      calls.push(init!);
      return new Response(
        JSON.stringify({ trace_id: 'tr_test', received_at: new Date().toISOString() }),
        {
          status: 202,
        },
      );
    }) as typeof fetch;

    const client = new AuditTrailClient({
      apiKey: 'at_test_key',
      projectId: 'proj_1',
      baseUrl: 'http://localhost:3000',
    });

    const trace = client.trace('support_flow', {
      actor: { actor_id: 'u1', actor_type: 'user' },
      permission_snapshot: {
        policy_version: '1',
        roles: ['agent'],
        scopes: ['read'],
      },
    });
    const span = trace.span('main');
    span.addEvent(promptEvent(span.spanId, { messages: [] }));
    trace.complete();
    await client.flush();

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(calls[0]?.headers).toMatchObject({
      'X-Api-Key': 'at_test_key',
      'X-Project-Id': 'proj_1',
    });
  });

  it('delegates flush to a buffered sink', async () => {
    const fetchMock = jest.fn(async () => new Response('{}', { status: 202 }));
    global.fetch = fetchMock as typeof fetch;

    const sink = new BufferedTransport({
      apiKey: 'at_test_key',
      projectId: 'proj_1',
      baseUrl: 'http://localhost:3000',
      flushIntervalMs: 60_000,
    });

    const client = new AuditTrailClient({
      apiKey: 'at_test_key',
      projectId: 'proj_1',
      baseUrl: 'http://localhost:3000',
      sink,
    });

    const trace = client.trace('demo', {
      actor: { actor_id: 'u1', actor_type: 'user' },
      permission_snapshot: { policy_version: '1', roles: [], scopes: [] },
    });
    trace.span('root');
    await client.flush();
    await sink.shutdown();

    expect(fetchMock).toHaveBeenCalled();
  });
});
