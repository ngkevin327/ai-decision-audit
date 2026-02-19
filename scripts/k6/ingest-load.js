import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * Ingest load test — PRD target: 5k events/sec sustained 5 minutes.
 * Run: k6 run scripts/k6/ingest-load.js
 * Env: API_URL, INGEST_API_KEY, PROJECT_ID (optional header)
 */
const TARGET_RATE = Number(__ENV.TARGET_RATE || 5000);
const DURATION = __ENV.DURATION || '5m';

export const options = {
  scenarios: {
    ingest_sustained: {
      executor: 'constant-arrival-rate',
      rate: TARGET_RATE,
      timeUnit: '1s',
      duration: DURATION,
      preAllocatedVUs: Number(__ENV.PRE_ALLOCATED_VUS || 200),
      maxVUs: Number(__ENV.MAX_VUS || 600),
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    checks: ['rate>0.99'],
  },
};

const API_URL = __ENV.API_URL || 'http://localhost:3000';
const API_KEY = __ENV.INGEST_API_KEY || 'at_live_replace_me';
const PROJECT_ID = __ENV.PROJECT_ID;

export function setup() {
  return { start: Date.now() };
}

export default function ingestLoad() {
  const traceId = `tr_k6_${__VU}_${__ITER}_${Date.now()}`;
  const payload = JSON.stringify({
    schema_version: '1.0',
    trace_id: traceId,
    workflow_name: 'k6_load',
    actor: { actor_id: 'k6', actor_type: 'service' },
    permission_snapshot: {
      policy_version: 'k6',
      roles: ['developer'],
      scopes: ['trace:ingest'],
    },
    started_at: new Date().toISOString(),
    spans: [
      {
        span_id: 'span_k6',
        name: 'load',
        events: [
          {
            schema_version: '1.0',
            event_id: `evt_k6_${traceId}`,
            type: 'custom',
            occurred_at: new Date().toISOString(),
            span_id: 'span_k6',
            payload: { vu: __VU, iter: __ITER },
          },
        ],
      },
    ],
  });

  const headers = {
    'Content-Type': 'application/json',
    'X-Api-Key': API_KEY,
  };
  if (PROJECT_ID) {
    headers['X-Project-Id'] = PROJECT_ID;
  }

  const response = http.post(`${API_URL}/v1/traces`, payload, { headers });

  check(response, {
    'status is 202': (r) => r.status === 202,
    'has trace_id': (r) => {
      try {
        return Boolean(JSON.parse(r.body).trace_id);
      } catch {
        return false;
      }
    },
  });

  sleep(0.01);
}

export function handleSummary(data) {
  const accepted = data.metrics.checks?.values?.passes ?? 0;
  const p95 = data.metrics.http_req_duration?.values?.['p(95)'] ?? 0;
  const rate = data.metrics.http_reqs?.values?.rate ?? 0;
  return {
    stdout: [
      `k6 ingest summary`,
      `  http_reqs/s: ${rate.toFixed(1)} (target ${TARGET_RATE}/s)`,
      `  p95 latency: ${p95.toFixed(1)} ms`,
      `  checks passed: ${accepted}`,
      `  duration: ${DURATION}`,
    ].join('\n'),
  };
}
