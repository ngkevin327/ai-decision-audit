import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { EventType, Prisma, TraceStatus } from '@prisma/client';
import type { TraceIngestEnvelope, TraceSpan } from '@audit-trail/schema';
import { computeEventChain, sealTrace } from '@audit-trail/integrity';
import { TenantContextService } from '../common/tenant/tenant-context.service';
import { PrismaService } from '../prisma/prisma.service';
import { TracesRepository } from '../traces/traces.repository';
import { SchemaValidationService } from '../validation/schema-validation.service';
import { IngestTraceResponseDto } from './dto/ingest-trace-response.dto';
import { IdempotencyService } from './idempotency.service';
import { IngestPublisher } from './ingest.publisher';
import { PayloadOffloadService } from './payload-offload.service';
import { IngestMetrics } from '../metrics/ingest.metrics';
import { PermissionSnapshotHandler } from './permission-snapshot.handler';
import { SpanTreeValidator } from './span-tree.validator';

interface FlatEvent {
  spanExternalId: string;
  event: TraceIngestEnvelope['spans'][number]['events'][number];
}

@Injectable()
export class IngestService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tracesRepository: TracesRepository,
    private readonly schemaValidation: SchemaValidationService,
    private readonly tenantContext: TenantContextService,
    private readonly idempotency: IdempotencyService,
    private readonly payloadOffload: PayloadOffloadService,
    private readonly publisher: IngestPublisher,
    private readonly permissionSnapshot: PermissionSnapshotHandler,
    private readonly metrics: IngestMetrics,
    private readonly spanTreeValidator: SpanTreeValidator,
  ) {}

  async acceptTrace(body: unknown, idempotencyKey?: string): Promise<IngestTraceResponseDto> {
    const ctx = this.tenantContext.require();

    if (idempotencyKey) {
      const cached = await this.idempotency.findCached(ctx.organizationId, idempotencyKey);
      if (cached) return cached;
    }

    const envelope = this.schemaValidation.validateTraceEnvelope(body);
    const snapshot = this.permissionSnapshot.assertPresent(envelope);
    const spanValidation = this.spanTreeValidator.validate(envelope.spans);

    if (!ctx.projectId) {
      throw new BadRequestException('Ingest requires an API key scoped to a project');
    }

    const serverReceivedAt = new Date();
    const flatEvents = this.flattenEvents(envelope.spans);
    const chainInput = flatEvents.map((item) => item.event);
    const { contentHashes, chainHashes } = computeEventChain(chainInput);
    const seal = sealTrace(chainInput);
    const tags = {
      ...(envelope.tags ?? {}),
      ...(spanValidation.orphanSpanIds.length
        ? { orphan_span_warning: spanValidation.orphanSpanIds.join(',') }
        : {}),
    };

    try {
      const offloads = await Promise.all(
        flatEvents.map((item) =>
          this.payloadOffload.maybeOffload(
            ctx.organizationId,
            envelope.trace_id,
            item.event.event_id,
            item.event.payload,
          ),
        ),
      );

      const events = flatEvents.map((item, sequenceIndex) => ({
        spanExternalId: item.spanExternalId,
        externalEventId: item.event.event_id,
        type: item.event.type as EventType,
        occurredAt: new Date(item.event.occurred_at),
        sequenceIndex,
        contentHash: contentHashes[sequenceIndex],
        chainHash: chainHashes[sequenceIndex],
        payloadRef: offloads[sequenceIndex]?.payloadRef ?? null,
      }));

      const trace = await this.tracesRepository.createFromIngest({
        organizationId: ctx.organizationId,
        projectId: ctx.projectId,
        environmentId: ctx.environmentId,
        externalTraceId: envelope.trace_id,
        workflowName: envelope.workflow_name,
        status: (envelope.status as TraceStatus) ?? TraceStatus.in_progress,
        startedAt: serverReceivedAt,
        serverReceivedAt,
        actor: envelope.actor as unknown as Prisma.InputJsonValue,
        tags,
        chainHash: seal.finalChainHash,
        chainVersion: seal.chainVersion,
        permissionSnapshot: this.permissionSnapshot.toPersistence(snapshot, serverReceivedAt),
        spans: envelope.spans.map((span) => ({
          externalSpanId: span.span_id,
          parentSpanId: span.parent_span_id,
          name: span.name,
        })),
        events,
      });

      const response: IngestTraceResponseDto = {
        trace_id: trace.externalTraceId,
        received_at: serverReceivedAt.toISOString(),
      };

      if (idempotencyKey) {
        await this.idempotency.store(ctx.organizationId, idempotencyKey, trace.id, response);
      }

      this.metrics.recordAccepted();

      void this.publisher
        .publishIndexJob({
          traceId: trace.id,
          organizationId: ctx.organizationId,
          projectId: ctx.projectId,
          enqueuedAt: serverReceivedAt.toISOString(),
        })
        .catch(() => {
          this.metrics.recordRejected();
        });

      return response;
    } catch (error) {
      this.metrics.recordRejected();
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
            received_at: existing.serverReceivedAt.toISOString(),
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
