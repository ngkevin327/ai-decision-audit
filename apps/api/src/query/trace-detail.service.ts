import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { TenantContextService } from '../common/tenant/tenant-context.service';
import { PrismaService } from '../prisma/prisma.service';
import type { TraceDetailDto, TraceEventTimelineItemDto } from './dto/trace-detail.dto';

@Injectable()
export class TraceDetailService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
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
      events,
    };
  }
}
