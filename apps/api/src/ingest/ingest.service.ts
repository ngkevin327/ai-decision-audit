import { BadRequestException, Injectable } from '@nestjs/common';
import { EnvironmentName, EventType, TraceStatus } from '@prisma/client';
import type { TraceIngestEnvelope, TraceSpan } from '@audit-trail/schema';
import { computeEventChain, sealTrace } from '../integrity/hash-chain';
import { TenantContextService } from '../common/tenant/tenant-context.service';
import { PrismaService } from '../prisma/prisma.service';
import { SchemaValidationService } from '../validation/schema-validation.service';
import { IngestTraceResponseDto } from './dto/ingest-trace-response.dto';

interface FlatEvent {
  spanExternalId: string;
  event: TraceIngestEnvelope['spans'][number]['events'][number];
}

@Injectable()
export class IngestService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly schemaValidation: SchemaValidationService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async acceptTrace(body: unknown, _idempotencyKey?: string): Promise<IngestTraceResponseDto> {
    const envelope = this.schemaValidation.validateTraceEnvelope(body);
    const ctx = this.tenantContext.require();

    if (!ctx.projectId) {
      throw new BadRequestException('Ingest requires an API key scoped to a project');
    }

    const receivedAt = new Date();
    const flatEvents = this.flattenEvents(envelope.spans);
    const chainInput = flatEvents.map((item) => item.event);
    const { contentHashes, chainHashes } = computeEventChain(chainInput);
    const seal = sealTrace(chainInput);

    const trace = await this.prisma.$transaction(async (tx) => {
      const created = await tx.trace.create({
        data: {
          organizationId: ctx.organizationId,
          projectId: ctx.projectId!,
          environmentId: ctx.environmentId,
          externalTraceId: envelope.trace_id,
          workflowName: envelope.workflow_name,
          status: (envelope.status as TraceStatus) ?? TraceStatus.in_progress,
          startedAt: receivedAt,
          actor: envelope.actor,
          tags: envelope.tags ?? undefined,
          chainHash: seal.finalChainHash,
          chainVersion: seal.chainVersion,
          permissionSnapshot: {
            create: {
              policyVersion: envelope.permission_snapshot.policy_version,
              roles: envelope.permission_snapshot.roles,
              scopes: envelope.permission_snapshot.scopes,
              resourceIds: envelope.permission_snapshot.resource_ids ?? [],
              deniedResources: envelope.permission_snapshot.denied_resources ?? [],
              capturedAt: envelope.permission_snapshot.captured_at
                ? new Date(envelope.permission_snapshot.captured_at)
                : receivedAt,
            },
          },
        },
      });

      const spanIdByExternal = new Map<string, string>();
      for (const span of envelope.spans) {
        const row = await tx.span.create({
          data: {
            traceId: created.id,
            externalSpanId: span.span_id,
            parentSpanId: span.parent_span_id,
            name: span.name,
          },
        });
        spanIdByExternal.set(span.span_id, row.id);
      }

      let sequenceIndex = 0;
      for (const item of flatEvents) {
        const spanId = spanIdByExternal.get(item.spanExternalId);
        if (!spanId) continue;

        await tx.event.create({
          data: {
            spanId,
            organizationId: ctx.organizationId,
            externalEventId: item.event.event_id,
            type: item.event.type as EventType,
            occurredAt: new Date(item.event.occurred_at),
            sequenceIndex,
            contentHash: contentHashes[sequenceIndex],
            chainHash: chainHashes[sequenceIndex],
            payloadRef: null,
          },
        });
        sequenceIndex += 1;
      }

      return created;
    });

    return {
      trace_id: trace.externalTraceId,
      received_at: receivedAt.toISOString(),
    };
  }

  private flattenEvents(spans: TraceSpan[]): FlatEvent[] {
    const items: FlatEvent[] = [];
    for (const span of spans) {
      for (const event of span.events) {
        items.push({ spanExternalId: span.span_id, event });
      }
    }
    return items;
  }
}
