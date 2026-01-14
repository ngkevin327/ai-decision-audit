# Audit export package format

Exports are delivered as ZIP archives produced by the export worker. Each package is scoped to one organization and contains tamper-evident metadata for compliance review.

## Archive layout

| File                        | Description                                                      |
| --------------------------- | ---------------------------------------------------------------- |
| `manifest.json`             | Signed summary with aggregate `chain_hash` and per-trace entries |
| `events.jsonl`              | One JSON object per line for every exported event                |
| `permission_snapshots.json` | Permission snapshots keyed by `trace_id`                         |

## Manifest schema

```json
{
  "schema_version": "1.0",
  "export_id": "uuid",
  "organization_id": "uuid",
  "generated_at": "ISO-8601 timestamp",
  "chain_hash": "sha256 hex",
  "trace_count": 1,
  "traces": [
    {
      "trace_id": "tr_external_id",
      "workflow_name": "support_refund",
      "chain_hash": "per-trace seal hash",
      "event_count": 42
    }
  ],
  "verification": {
    "algorithm": "hmac-sha256",
    "instructions": "Recompute event chain hashes with @audit-trail/integrity...",
    "manifest_signature": "hmac hex"
  }
}
```

## Chain hash verification

1. Parse `events.jsonl` and group rows by `trace_id`.
2. Sort events by `sequence_index` within each trace.
3. Recompute content and chain hashes using `@audit-trail/integrity` (`computeEventChain`).
4. Compare the final chain hash to the matching entry in `manifest.traces[].chain_hash`.
5. Confirm `manifest.chain_hash` matches the platform aggregate over exported traces.

## Manifest signature

The platform signs the manifest body (excluding `manifest_signature`) with HMAC-SHA256:

```
HMAC_SHA256(signing_secret, canonical_json(manifest_without_signature))
```

Store the signing secret in `EXPORT_SIGNING_SECRET`. Rotate keys by versioning `verification.algorithm` in future schema releases.

## Download access

Completed exports expose `GET /v1/exports/{id}/download`, returning a signed URL that expires after **24 hours** (`download_expires_at` on the export job).

## Event JSONL fields

Each line includes:

- `trace_id`, `span_id`, `event_id`, `type`, `occurred_at`
- `sequence_index`, `content_hash`, `chain_hash`
- `payload_ref` (hydrate separately if full payloads are required)

Payload bytes may be offloaded to object storage; auditors with storage access can resolve `payload_ref` using the same keys as the ingest pipeline.
