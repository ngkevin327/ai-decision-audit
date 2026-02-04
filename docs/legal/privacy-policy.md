# Privacy Policy (MVP stub)

**Effective date:** [DATE]  
**Last updated:** [DATE]

This document is a **placeholder** for the AI Audit Trail platform beta. Replace with counsel-reviewed language before general availability.

## Summary

AI Audit Trail ("we", "us") processes telemetry that your applications send when you integrate our SDK or API. This typically includes workflow metadata, model prompts, tool inputs/outputs, and permission snapshots you choose to record.

## Data we collect

- **Account data:** organization name, user email, role assignments
- **Audit telemetry:** trace envelopes, events, permission snapshots, API keys (hashed at rest)
- **Operational logs:** request metadata, error reports, usage quotas

## How we use data

- Provide trace ingest, search, replay, and export features
- Enforce plan quotas, retention, and security controls
- Send transactional email (export ready, quota warnings) when configured

## Retention

Retention follows your plan tier (see [docs/pricing-plans.md](../pricing-plans.md)). Expired traces are removed by automated compaction jobs.

## Subprocessors

Staging/production may use AWS (compute, RDS, S3), SendGrid (email), and Clerk (authentication). List final subprocessors in the customer DPA.

## Your choices

- Configure ingest redaction in the SDK
- Request export packages for compliance review
- Contact [privacy@example.com] for access/deletion requests (process TBD)

## Contact

[Company legal entity]  
[Address]  
privacy@example.com
