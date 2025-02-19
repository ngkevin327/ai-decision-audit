import { BadRequestException, Injectable } from '@nestjs/common';
import type { PermissionSnapshot, TraceIngestEnvelope } from '@audit-trail/schema';

@Injectable()
export class PermissionSnapshotHandler {
  assertPresent(envelope: TraceIngestEnvelope): PermissionSnapshot {
    const snapshot = envelope.permission_snapshot;
    if (!snapshot?.policy_version || !snapshot.roles?.length) {
      throw new BadRequestException({
        message: 'permission_snapshot is required',
        code: 'PERMISSION_SNAPSHOT_REQUIRED',
        errors: [
          { pointer: '/permission_snapshot', message: 'must include policy_version and roles' },
        ],
      });
    }
    return snapshot;
  }

  toPersistence(snapshot: PermissionSnapshot, fallbackCapturedAt: Date) {
    return {
      policyVersion: snapshot.policy_version,
      roles: snapshot.roles,
      scopes: snapshot.scopes ?? [],
      resourceIds: snapshot.resource_ids ?? [],
      deniedResources: snapshot.denied_resources ?? [],
      capturedAt: snapshot.captured_at ? new Date(snapshot.captured_at) : fallbackCapturedAt,
    };
  }
}
