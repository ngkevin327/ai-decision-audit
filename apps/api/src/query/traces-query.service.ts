import { Injectable } from '@nestjs/common';
import { Prisma, TraceStatus } from '@prisma/client';
import { TenantContextService } from '../common/tenant/tenant-context.service';
import { PrismaService } from '../prisma/prisma.service';
import type { TraceSearchQueryDto } from './dto/trace-search-query.dto';
import type { TraceListItemDto, TraceListResponseDto } from './dto/trace-list-item.dto';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

@Injectable()
export class TracesQueryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async search(query: TraceSearchQueryDto): Promise<TraceListResponseDto> {
    const ctx = this.tenantContext.require();
    const limit = Math.min(query.limit ?? DEFAULT_LIMIT, MAX_LIMIT);

    const where: Prisma.TraceWhereInput = {
      organizationId: ctx.organizationId,
      projectId: query.projectId ?? ctx.projectId,
      status: query.status,
      workflowName: query.workflowName
        ? { equals: query.workflowName, mode: 'insensitive' }
        : query.q
          ? { contains: query.q, mode: 'insensitive' }
          : undefined,
      primaryModel: query.model,
      startedAt: {
        gte: query.startedAfter ? new Date(query.startedAfter) : undefined,
        lte: query.startedBefore ? new Date(query.startedBefore) : undefined,
      },
    };

    if (query.actorId) {
      where.actor = { path: ['actor_id'], equals: query.actorId };
    }

    if (query.tagKey) {
      where.tags = {
        path: [query.tagKey],
        equals: query.tagValue ?? undefined,
      };
    }

    const rows = await this.prisma.trace.findMany({
      where,
      orderBy: [{ startedAt: 'desc' }, { id: 'desc' }],
      take: limit,
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

    return {
      traces: rows.map((row) => this.toListItem(row)),
      next_cursor: null,
    };
  }

  private toListItem(row: {
    externalTraceId: string;
    workflowName: string;
    status: TraceStatus;
    startedAt: Date;
    serverReceivedAt: Date;
    completedAt: Date | null;
    projectId: string;
    chainHash: string | null;
  }): TraceListItemDto {
    return {
      trace_id: row.externalTraceId,
      workflow_name: row.workflowName,
      status: row.status,
      started_at: row.startedAt.toISOString(),
      received_at: row.serverReceivedAt.toISOString(),
      completed_at: row.completedAt?.toISOString() ?? null,
      project_id: row.projectId,
      chain_hash: row.chainHash,
    };
  }
}
