# MVP launch checklist

Formal acceptance gate from PRD §19. Update status as each item is verified on staging before public beta.

| #   | Item                                                 | Owner | Status      | Evidence                                                                   |
| --- | ---------------------------------------------------- | ----- | ----------- | -------------------------------------------------------------------------- |
| 1   | SDK published with Node + Python quickstarts         | Eng   | Done        | `packages/sdk-node`, `packages/sdk-python`, `docs/sdk/*`, release workflow |
| 2   | Sample app E2E: ingest → trace → replay → export     | Eng   | Done        | `examples/copilot-support`, README quickstart, export pipeline             |
| 3   | RBAC matrix verified by automated tests              | Eng   | Done        | `apps/api/test/integration/rbac.spec.ts`                                   |
| 4   | No cross-tenant data leakage                         | Eng   | Done        | `apps/api/test/security/cross-tenant.spec.ts`, tenant isolation tests      |
| 5   | Uptime / ingest SLO monitoring live                  | Ops   | Ready       | Prometheus metrics on API; wire Grafana on staging                         |
| 6   | Privacy policy + DPA template published              | Legal | Done        | `docs/legal/privacy-policy.md`, `docs/legal/dpa-template.md`               |
| 7   | Staging environment with 3 design partners ingesting | GTM   | In progress | `docs/deployment/staging.md`, deploy workflow                              |
| 8   | Load test baseline documented                        | Eng   | Done        | `scripts/k6/ingest-load.js`, `docs/performance/load-test-results.md`       |
| 9   | OWASP ZAP baseline in CI                             | Eng   | Done        | `.github/workflows/security-scan.yml`                                      |
| 10  | Dependency audit in CI / release gate                | Eng   | Done        | `pnpm audit` via `audit:deps` script                                       |
| 11  | OpenAPI spec matches implemented routes              | Eng   | Done        | `apps/api/openapi.yaml`, Postman collection                                |
| 12  | On-call runbook and seed data for demos              | Eng   | Done        | `docs/runbooks/on-call.md`, `scripts/seed-staging.ts`                      |

## Pre-announce verification (Day 60)

- [ ] Run `pnpm test` and integration workflow green on `main`
- [ ] Execute staging deploy workflow; smoke ingest returns `202`
- [ ] k6 sustained load test recorded in `docs/performance/load-test-results.md`
- [ ] ZAP baseline report reviewed; no critical findings open
- [ ] Design partner checklist: 3 orgs with active API keys on staging
- [ ] Announce beta in changelog / status page

## Sign-off

| Role        | Name | Date | Notes |
| ----------- | ---- | ---- | ----- |
| Engineering |      |      |       |
| Product     |      |      |       |
| Legal       |      |      |       |
