import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { EventType, TraceStatus } from '@prisma/client';
import type { TraceIngestEnvelope, TraceSpan } from '@audit-trail/schema';
import { computeEventChain, sealTrace } from '../integrity/hash-chain';
import { TenantContextService } from '../common/tenant/tenant-context.service';
import { PrismaService } from '../prisma/prisma.service';
import { SchemaValidationService } from '../validation/schema-validation.service';
import { IngestTraceResponseDto } from './dto/ingest-trace-response.dto';
import { IdempotencyService } from './idempotency.service';
import { IngestPublisher } from './ingest.publisher';
import { PayloadOffloadService } from './payload-offload.service';
import { IngestMetrics } from '../metrics/ingest.metrics';
import { PermissionSnapshotHandler } from './permission-snapshot.handler';

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
    private readonly idempotency: IdempotencyService,
    private readonly payloadOffload: PayloadOffloadService,
    private readonly publisher: IngestPublisher,
    private readonly permissionSnapshot: PermissionSnapshotHandler,
    private readonly metrics: IngestMetrics,
  ) {}

  async acceptTrace(body: unknown, idempotencyKey?: string): Promise<IngestTraceResponseDto> {
    const ctx = this.tenantContext.require();

    if (idempotencyKey) {
      const cached = await this.idempotency.findCached(ctx.organizationId, idempotencyKey);
      if (cached) return cached;
    }

    const envelope = this.schemaValidation.validateTraceEnvelope(body);
    const snapshot = this.permissionSnapshot.assertPresent(envelope);

    if (!ctx.projectId) {
      throw new BadRequestException('Ingest requires an API key scoped to a project');
    }

    const receivedAt = new Date();
    const flatEvents = this.flattenEvents(envelope.spans);
    const chainInput = flatEvents.map((item) => item.event);
    const { contentHashes, chainHashes } = computeEventChain(chainInput);
    const seal = sealTrace(chainInput);

    try {
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
              create: this.permissionSnapshot.toPersistence(snapshot, receivedAt),
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

          const offload = await this.payloadOffload.maybeOffload(
            ctx.organizationId,
            created.id,
            item.event.event_id,
            item.event.payload,
          );

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
              payloadRef: offload.payloadRef,
            },
          });
          sequenceIndex += 1;
        }

        return created;
      });

      const response: IngestTraceResponseDto = {
        trace_id: trace.externalTraceId,
        received_at: receivedAt.toISOString(),
      };

      await this.publisher.publishIndexJob({
        traceId: trace.id,
        organizationId: ctx.organizationId,
        projectId: ctx.projectId!,
        enqueuedAt: receivedAt.toISOString(),
      });

      if (idempotencyKey) {
        await this.idempotency.store(ctx.organizationId, idempotencyKey, trace.id, response);
      }

      return response;
    } catch (error) {
      if (this.isDuplicateEventError(error)) {
        const existing = await this.prisma.trace.findUnique({
          where: {
            organizationId_externalTraceId: {
              organizationId: ctx.organizationId,
              externalTraceId: envelope.trace_id,
            },
          },
        });
        if (existing) {
          return {
            trace_id: existing.externalTraceId,
            received_at: existing.startedAt.toISOString(),
          };
        }
        throw new ConflictException('Duplicate event_id detected');
      }
      throw error;
    }
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

  private isDuplicateEventError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    );
  }
}
