# Data Processing Agreement (template stub)

**Status:** MVP placeholder — not legal advice. Engage counsel before enterprise sales.

This Data Processing Agreement ("DPA") forms part of the agreement between **Customer** and **Provider** (AI Audit Trail) when Customer uses the audit telemetry services.

## 1. Definitions

- **Customer Data** — trace envelopes, events, permission snapshots, and related metadata submitted via the API or SDK
- **Personal Data** — any Customer Data relating to an identified or identifiable individual, as defined by applicable law
- **Services** — ingest, storage, indexing, query, replay, and export features

## 2. Roles

- Customer is the **Controller** (or Business) for Customer Data
- Provider is the **Processor** (or Service Provider) except where Provider acts as Controller for account billing and security logs

## 3. Processing instructions

Provider shall process Customer Data only to:

1. Provide the Services per the subscription and documentation
2. Apply retention, quota, and security controls configured for the account
3. Generate export packages when authorized by Customer users with auditor role

## 4. Security measures

Provider maintains administrative, technical, and organizational measures including:

- Tenant isolation on organization and project boundaries
- Encryption in transit (TLS) and at rest for database and object storage
- API key hashing, signed export URLs with expiry, and tamper-evident hash chains

## 5. Subprocessors

Provider may engage subprocessors listed in Annex B (AWS, SendGrid, Clerk, etc.). Provider will notify Customer of material changes.

## 6. Data subject requests

Provider will assist Customer in responding to data subject requests within reasonable time, subject to Customer providing sufficient information.

## 7. Deletion and return

Upon termination, Provider deletes Customer Data within [30] days except where law requires retention. Export feature allows Customer to retrieve packages before deletion.

## 8. Audit rights

Customer may request a summary of SOC 2 / ISO reports when available. Onsite audits by mutual agreement for Enterprise tier.

## Annex A — Processing details

| Item               | Detail                                 |
| ------------------ | -------------------------------------- |
| Subject matter     | AI copilot audit telemetry             |
| Duration           | Subscription term                      |
| Nature             | Collect, store, index, display, export |
| Categories of data | Prompts, tool I/O, permission metadata |
| Data subjects      | End users of Customer applications     |

## Annex B — Subprocessors (fill before signature)

| Subprocessor        | Purpose             | Location |
| ------------------- | ------------------- | -------- |
| Amazon Web Services | Hosting, RDS, S3    | [region] |
| SendGrid            | Transactional email | USA      |
| Clerk               | Authentication      | USA      |

## Signatures

Customer: ************\_************ Date: ****\_****

Provider: ************\_************ Date: ****\_****
