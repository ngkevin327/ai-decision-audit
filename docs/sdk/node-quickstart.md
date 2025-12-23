# Node.js SDK quickstart

Install the package (monorepo workspace or npm after publish):

```bash
pnpm add @audit-trail/sdk
```

Send your first trace in under 15 lines:

```typescript
import { AuditTrailClient } from '@audit-trail/sdk';

const client = new AuditTrailClient({
  apiKey: process.env.AUDIT_TRAIL_API_KEY!,
  projectId: process.env.AUDIT_TRAIL_PROJECT_ID!,
  environment: 'staging',
  baseUrl: process.env.AUDIT_TRAIL_BASE_URL ?? 'http://localhost:3000',
});

const trace = client.trace('support_refund', {
  actor: { actor_id: 'user_42', actor_type: 'user', display_name: 'Alex' },
  permission_snapshot: {
    policy_version: '2026.05.1',
    roles: ['support_agent'],
    scopes: ['refunds:approve'],
  },
});
const span = trace.span('refund_flow');
span.addEvent({
  schema_version: '1.0',
  event_id: 'evt_1',
  type: 'prompt',
  occurred_at: new Date().toISOString(),
  span_id: span.spanId,
  payload: { messages: [{ role: 'user', content: 'Approve refund' }] },
});
trace.complete();
await client.flush();
```

OpenAI wrapper:

```typescript
import { wrapOpenAIChatCompletions } from '@audit-trail/sdk/integrations/openai';

const traced = wrapOpenAIChatCompletions(client, openai, span);
await traced.chat.completions.create({ model: 'gpt-4.1', messages: [] });
```

Authorization headers in payloads are redacted automatically before ingest.
