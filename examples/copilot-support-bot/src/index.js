import { AuditTrailClient } from '@audit-trail/sdk';

const apiKey = process.env.AUDIT_TRAIL_API_KEY ?? 'at_demo_key';
const projectId = process.env.AUDIT_TRAIL_PROJECT_ID ?? 'proj_demo';
const baseUrl = process.env.AUDIT_TRAIL_BASE_URL ?? 'http://localhost:3000';

const client = new AuditTrailClient({
  apiKey,
  projectId,
  environment: 'staging',
  baseUrl,
});

const trace = client.trace('copilot_support', {
  actor: { actor_id: 'agent_7', actor_type: 'agent', display_name: 'Support Copilot' },
  permission_snapshot: {
    policy_version: '2026.05.1',
    roles: ['support_agent'],
    scopes: ['tickets:read', 'refunds:propose'],
  },
  tags: { channel: 'chat' },
});

const span = trace.span('handle_ticket');
span.addEvent({
  schema_version: '1.0',
  event_id: 'evt_prompt_demo',
  type: 'prompt',
  occurred_at: new Date().toISOString(),
  span_id: span.spanId,
  payload: {
    messages: [{ role: 'user', content: 'Customer asks for refund on order ord_991' }],
    model: 'gpt-4.1',
  },
});

span.addEvent({
  schema_version: '1.0',
  event_id: 'evt_tool_demo',
  type: 'tool_call',
  occurred_at: new Date().toISOString(),
  span_id: span.spanId,
  payload: {
    tool_name: 'lookup_order',
    input: { order_id: 'ord_991' },
    output: { status: 'shipped', eligible: true },
  },
});

trace.complete();
await client.flush();

console.log('Demo trace submitted for copilot-support-bot');
