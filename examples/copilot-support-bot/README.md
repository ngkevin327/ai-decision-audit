# Copilot support bot example

Minimal reference integration that records a support copilot workflow with the Audit Trail Node SDK.

## Run

```bash
export AUDIT_TRAIL_API_KEY=at_your_key
export AUDIT_TRAIL_PROJECT_ID=proj_your_id
export AUDIT_TRAIL_BASE_URL=http://localhost:3000

pnpm install
pnpm --filter copilot-support-bot start
```

The script emits one staged trace with prompt and tool-call events, then flushes through the buffered transport.
