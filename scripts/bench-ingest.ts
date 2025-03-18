/**
 * Local ingest latency benchmark for a 20-event trace.
 * Usage: pnpm exec ts-node scripts/bench-ingest.ts
 */
const API_URL = process.env.API_URL ?? 'http://localhost:3000';
const API_KEY = process.env.INGEST_API_KEY ?? 'at_live_replace_me';

function buildTrace(eventCount: number) {
  const events = Array.from({ length: eventCount }, (_, index) => ({
    schema_version: '1.0',
    event_id: `evt_bench_${index}`,
    type: 'custom',
    occurred_at: new Date().toISOString(),
    span_id: 'span_bench',
    payload: { name: 'step', data: { index } },
  }));

  return {
    schema_version: '1.0',
    trace_id: `tr_bench_${Date.now()}`,
    workflow_name: 'bench_workflow',
    actor: { actor_id: 'bench', actor_type: 'service' },
    permission_snapshot: {
      policy_version: 'bench',
      roles: ['developer'],
      scopes: ['trace:ingest'],
    },
    started_at: new Date().toISOString(),
    spans: [{ span_id: 'span_bench', name: 'bench', events }],
  };
}

async function main() {
  const body = buildTrace(20);
  const started = performance.now();
  const response = await fetch(`${API_URL}/v1/traces`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': API_KEY,
    },
    body: JSON.stringify(body),
  });
  const elapsed = performance.now() - started;
  console.log({ status: response.status, elapsedMs: Math.round(elapsed) });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
