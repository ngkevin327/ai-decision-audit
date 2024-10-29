# ADR-001: Event Schema Versioning

**Status:** Accepted  
**Date:** 2026-05-20

## Context

SDKs, the ingest API, and export pipeline share a single event contract. Customers may lag SDK upgrades while the platform evolves.

## Decision

1. Every payload includes `schema_version` (currently `"1.0"`).
2. JSON Schema files live under `packages/schema/schemas/v{N}/`.
3. Patch-level changes (new optional fields) stay within the same major folder and remain backward compatible.
4. Breaking changes increment the folder (`v2`) and require a new ADR.
5. The API rejects unknown major versions with `400` and a clear error pointer.

## Consequences

- Ingest validates against the declared version before enqueue.
- Hash chain computation uses canonical JSON independent of schema version, but event shape must remain hash-stable for a given version.
- Documentation and SDK releases are tagged with the schema version they target.
