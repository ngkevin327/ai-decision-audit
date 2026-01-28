# Plan tiers, retention, and quotas

Pricing aligns with the product vision doc. Limits below are enforced by the API (query retention filters, ingest quota middleware) and the retention compaction worker.

## Plan comparison

| Tier           | Monthly events | Retention | Export        | Notes                             |
| -------------- | -------------- | --------- | ------------- | --------------------------------- |
| **Starter**    | 50,000         | 30 days   | Yes (auditor) | Default for new organizations     |
| **Growth**     | 500,000        | 90 days   | Yes           | Higher limits for scaling teams   |
| **Enterprise** | 5,000,000      | 365 days  | Yes           | Custom contracts may raise limits |

## Retention

- Traces with `started_at` before the retention cutoff are excluded from search and detail APIs (404).
- The worker compaction job permanently deletes expired traces and cascaded events.
- Retention days are defined in `RetentionService` (`starter`: 30, `growth`: 90, `enterprise`: 365).

## Monthly event quota

- Quota is counted as **ingested events** in the current UTC calendar month.
- Ingest returns **429** when `events_used + incoming_events` would exceed the plan limit.
- At **80%** usage, an email is sent to the first `org_admin` on the organization (SendGrid).
- At **100%**, ingest is blocked and the web app shows the quota banner.

## API endpoints

- `GET /v1/quota` — current period usage snapshot for the authenticated organization.
- Billing UI: `/settings/billing` (forensic web app).

## Environment

| Variable              | Purpose                               |
| --------------------- | ------------------------------------- |
| `SENDGRID_API_KEY`    | Quota warning and export-ready emails |
| `SENDGRID_FROM_EMAIL` | Sender address for transactional mail |
