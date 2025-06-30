import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantContextService } from '../common/tenant/tenant-context.service';
import { PrismaService } from '../prisma/prisma.service';
import type {
  PermissionSnapshotDto,
  TraceDetailDto,
  TraceEventTimelineItemDto,
} from './dto/trace-detail.dto';
import { PayloadHydrationService } from './payload-hydration.service';
import { isWithinRetention } from './retention.policy';

@Injectable()
export class TraceDetailService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
    private readonly payloadHydration: PayloadHydrationService,
  ) {}

  async getDetail(traceId: string): Promise<TraceDetailDto> {
    const ctx = this.tenantContext.require();
    const trace = await this.prisma.trace.findFirst({
      where: {
        organizationId: ctx.organizationId,
        projectId: ctx.projectId,
        OR: [{ id: traceId }, { externalTraceId: traceId }],
      },
      include: {
        permissionSnapshot: true,
        spans: {
          include: {
            events: { orderBy: { sequenceIndex: 'asc' } },
          },
        },
      },
    });

    if (!trace) {
      throw new NotFoundException('Trace not found');
    }

    const organization = await this.prisma.organization.findUnique({
      where: { id: ctx.organizationId },
    });
    if (!organization || !isWithinRetention(trace.startedAt, organization.planTier)) {
      throw new NotFoundException('Trace not found');
    }

    const spanNameByExternal = new Map(trace.spans.map((span) => [span.externalSpanId, span.name]));
    const events: TraceEventTimelineItemDto[] = [];

    for (const span of trace.spans) {
      for (const event of span.events) {
        events.push({
          event_id: event.externalEventId,
          span_id: span.externalSpanId,
          span_name: spanNameByExternal.get(span.externalSpanId) ?? span.name,
          type: event.type,
          occurred_at: event.occurredAt.toISOString(),
          sequence_index: event.sequenceIndex,
          content_hash: event.contentHash,
          chain_hash: event.chainHash,
          payload_ref: event.payloadRef,
          payload: null,
        });
      }
    }

    events.sort((a, b) => a.sequence_index - b.sequence_index);

    const cache = this.payloadHydration.createRequestCache();
    const payloads = await this.payloadHydration.hydrateMany(
      events.map((event) => event.payload_ref),
      cache,
    );
    events.forEach((event, index) => {
      event.payload = payloads[index];
    });

    return {
      trace_id: trace.externalTraceId,
      workflow_name: trace.workflowName,
      status: trace.status,
      started_at: trace.startedAt.toISOString(),
      received_at: trace.serverReceivedAt.toISOString(),
      completed_at: trace.completedAt?.toISOString() ?? null,
      sealed_at: trace.sealedAt?.toISOString() ?? null,
      chain_hash: trace.chainHash,
      actor: trace.actor,
      tags: trace.tags ?? undefined,
      permission_snapshot: this.toPermissionSnapshot(trace.permissionSnapshot),
      events,
    };
  }

  private toPermissionSnapshot(
    snapshot: {
      policyVersion: string;
      roles: string[];
      scopes: string[];
      resourceIds: string[];
      deniedResources: string[];
      capturedAt: Date;
    } | null,
  ): PermissionSnapshotDto | null {
    if (!snapshot) {
      return null;
    }
    return {
      policy_version: snapshot.policyVersion,
      roles: snapshot.roles,
      scopes: snapshot.scopes,
      resource_ids: snapshot.resourceIds,
      denied_resources: snapshot.deniedResources,
      captured_at: snapshot.capturedAt.toISOString(),
    };
  }
}
