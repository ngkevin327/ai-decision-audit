import { Injectable, NotFoundException } from '@nestjs/common';
import { EventType, Prisma, TraceStatus } from '@prisma/client';
import { TenantContextService } from '../common/tenant/tenant-context.service';
import { PrismaService } from '../prisma/prisma.service';

export interface TraceListFilters {
  projectId?: string;
  status?: TraceStatus;
  workflowName?: string;
  startedAfter?: Date;
  startedBefore?: Date;
  tag?: { key: string; value: string };
  limit?: number;
}

export interface PersistIngestEventInput {
  spanExternalId: string;
  externalEventId: string;
  type: EventType;
  occurredAt: Date;
  sequenceIndex: number;
  contentHash: string;
  chainHash: string;
  payloadRef: string | null;
}

export interface PersistIngestTraceInput {
  organizationId: string;
  projectId: string;
  environmentId?: string;
  externalTraceId: string;
  workflowName: string;
  status: TraceStatus;
  startedAt: Date;
  serverReceivedAt: Date;
  actor: Prisma.InputJsonValue;
  tags?: Prisma.InputJsonValue;
  chainHash: string;
  chainVersion: number;
  permissionSnapshot: {
    policyVersion: string;
    roles: string[];
    scopes: string[];
    resourceIds: string[];
    deniedResources: string[];
    capturedAt: Date;
  };
  spans: Array<{
    externalSpanId: string;
    parentSpanId?: string;
    name: string;
  }>;
  events: PersistIngestEventInput[];
}

@Injectable()
export class TracesRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  private get organizationId(): string {
    return this.tenantContext.require().organizationId;
  }

  async createFromIngest(input: PersistIngestTraceInput) {
    return this.prisma.$transaction(async (tx) => {
      const trace = await tx.trace.create({
        data: {
          organizationId: input.organizationId,
          projectId: input.projectId,
          environmentId: input.environmentId,
          externalTraceId: input.externalTraceId,
          workflowName: input.workflowName,
          status: input.status,
          startedAt: input.startedAt,
          serverReceivedAt: input.serverReceivedAt,
          actor: input.actor,
          tags: input.tags,
          chainHash: input.chainHash,
          chainVersion: input.chainVersion,
          permissionSnapshot: { create: input.permissionSnapshot },
        },
      });

      const spanIdByExternal = new Map<string, string>();
      for (const span of input.spans) {
        const row = await tx.span.create({
          data: {
            traceId: trace.id,
            externalSpanId: span.externalSpanId,
            parentSpanId: span.parentSpanId,
            name: span.name,
          },
        });
        spanIdByExternal.set(span.externalSpanId, row.id);
      }

      for (const event of input.events) {
        const spanId = spanIdByExternal.get(event.spanExternalId);
        if (!spanId) continue;
        await tx.event.create({
          data: {
            spanId,
            organizationId: input.organizationId,
            externalEventId: event.externalEventId,
            type: event.type,
            occurredAt: event.occurredAt,
            sequenceIndex: event.sequenceIndex,
            contentHash: event.contentHash,
            chainHash: event.chainHash,
            payloadRef: event.payloadRef,
          },
        });
      }

      return trace;
    });
  }

  async findByExternalId(externalTraceId: string, projectId?: string) {
    const trace = await this.prisma.trace.findFirst({
      where: {
        organizationId: this.organizationId,
        externalTraceId,
        projectId,
      },
      include: {
        permissionSnapshot: true,
        spans: { include: { events: { orderBy: { sequenceIndex: 'asc' } } } },
      },
    });

    if (!trace) {
      throw new NotFoundException('Trace not found');
    }
    return trace;
  }

  async list(filters: TraceListFilters = {}) {
    const where: Prisma.TraceWhereInput = {
      organizationId: this.organizationId,
      projectId: filters.projectId,
      status: filters.status,
      workflowName: filters.workflowName,
      startedAt: {
        gte: filters.startedAfter,
        lte: filters.startedBefore,
      },
    };

    if (filters.tag) {
      where.tags = {
        path: [filters.tag.key],
        equals: filters.tag.value,
      };
    }

    return this.prisma.trace.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      take: filters.limit ?? 50,
      select: {
        id: true,
        externalTraceId: true,
        workflowName: true,
        status: true,
        startedAt: true,
        serverReceivedAt: true,
        completedAt: true,
        projectId: true,
        chainHash: true,
      },
    });
  }

  async existsInOrganization(traceId: string, organizationId: string): Promise<boolean> {
    const count = await this.prisma.trace.count({
      where: { id: traceId, organizationId },
    });
    return count > 0;
  }
}
