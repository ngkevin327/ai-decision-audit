import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, TraceStatus } from '@prisma/client';
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

@Injectable()
export class TracesRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  private get organizationId(): string {
    return this.tenantContext.require().organizationId;
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
