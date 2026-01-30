import { AuditTrailClient } from '@audit-trail/sdk';

export interface RefundScenarioConfig {
  apiKey: string;
  projectId: string;
  baseUrl?: string;
}

/**
 * Simulated support copilot refund decision with prompt, tool calls, and approval.
 * Demonstrates permission snapshot capture for compliance review.
 */
export async function runRefundScenario(config: RefundScenarioConfig): Promise<string> {
  const client = new AuditTrailClient({
    apiKey: config.apiKey,
    projectId: config.projectId,
    environment: 'staging',
    baseUrl: config.baseUrl ?? 'http://localhost:3000',
  });

  const trace = client.trace('support_refund', {
    actor: {
      actor_id: 'agent_refund_bot',
      actor_type: 'agent',
      display_name: 'Refund Copilot',
    },
    permission_snapshot: {
      policy_version: '2026.05.1',
      roles: ['support_agent'],
      scopes: ['tickets:read', 'refunds:propose'],
      resource_ids: ['ord_991'],
      denied_resources: ['refunds:execute_without_approval'],
      captured_at: new Date().toISOString(),
    },
    tags: { channel: 'chat', scenario: 'refund_demo' },
  });

  const span = trace.span('refund_decision');

  span.addEvent({
    schema_version: '1.0',
    event_id: 'evt_refund_prompt_001',
    type: 'prompt',
    occurred_at: new Date().toISOString(),
    span_id: span.spanId,
    payload: {
      model: 'gpt-4.1',
      messages: [
        {
          role: 'user',
          content: 'Customer requests refund for order ord_991 — shipped but damaged.',
        },
      ],
    },
  });

  span.addEvent({
    schema_version: '1.0',
    event_id: 'evt_refund_tool_lookup',
    type: 'tool_call',
    occurred_at: new Date().toISOString(),
    span_id: span.spanId,
    payload: {
      tool_name: 'lookup_order',
      input: { order_id: 'ord_991' },
      output: {
        status: 'delivered',
        amount: 129.99,
        eligible_for_refund: true,
        policy: 'damage_within_30_days',
      },
    },
  });

  span.addEvent({
    schema_version: '1.0',
    event_id: 'evt_refund_tool_propose',
    type: 'tool_call',
    occurred_at: new Date().toISOString(),
    span_id: span.spanId,
    payload: {
      tool_name: 'propose_refund',
      input: { order_id: 'ord_991', amount: 129.99, reason: 'damaged_goods' },
      output: { proposal_id: 'rf_prop_882', status: 'pending_approval' },
    },
  });

  span.addEvent({
    schema_version: '1.0',
    event_id: 'evt_refund_approval',
    type: 'approval',
    occurred_at: new Date().toISOString(),
    span_id: span.spanId,
    payload: {
      approver: 'supervisor_queue',
      decision: 'approved',
      proposal_id: 'rf_prop_882',
    },
  });

  span.addEvent({
    schema_version: '1.0',
    event_id: 'evt_refund_completion',
    type: 'completion',
    occurred_at: new Date().toISOString(),
    span_id: span.spanId,
    payload: {
      model: 'gpt-4.1',
      message: 'Refund approved and queued for order ord_991.',
      refund_id: 'rf_991_final',
    },
  });

  trace.complete();
  await client.flush();

  return trace.traceId;
}
