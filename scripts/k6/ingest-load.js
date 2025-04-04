import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<200'],
  },
};

const API_URL = __ENV.API_URL || 'http://localhost:3000';
const API_KEY = __ENV.INGEST_API_KEY || 'at_live_replace_me';

export default function ingestLoad() {
  const payload = JSON.stringify({
    schema_version: '1.0',
    trace_id: `tr_k6_${__VU}_${Date.now()}`,
    workflow_name: 'k6_load',
    actor: { actor_id: 'k6', actor_type: 'service' },
    permission_snapshot: { policy_version: 'k6', roles: ['developer'], scopes: [] },
    started_at: new Date().toISOString(),
    spans: [
      {
        span_id: 'span_k6',
        name: 'load',
        events: [
          {
            schema_version: '1.0',
            event_id: `evt_k6_${Date.now()}`,
            type: 'custom',
            occurred_at: new Date().toISOString(),
            span_id: 'span_k6',
            payload: { name: 'k6', data: { vu: __VU } },
          },
        ],
      },
    ],
  });

  const response = http.post(`${API_URL}/v1/traces`, payload, {
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': API_KEY,
    },
  });

  check(response, { 'status is 202': (r) => r.status === 202 });
  sleep(0.1);
}
