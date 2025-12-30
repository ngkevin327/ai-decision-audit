import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ExportJobStatus, Prisma } from '@prisma/client';
import { TenantContextService } from '../common/tenant/tenant-context.service';
import { PrismaService } from '../prisma/prisma.service';
import { QUEUE_SERVICE, type QueueService } from '../queue/queue.interface';

export const EXPORT_QUEUE = 'export';

export interface ExportFilters {
  project_id?: string;
  trace_ids?: string[];
  workflow_name?: string;
  started_after?: string;
  started_before?: string;
}

export interface ExportJobPayload {
  exportJobId: string;
  organizationId: string;
  projectId?: string;
  filters: ExportFilters;
}

export interface CreateExportInput {
  filters: ExportFilters;
}

export interface ExportJobResponse {
  export_id: string;
  status: ExportJobStatus;
  trace_count: number;
  created_at: string;
  completed_at: string | null;
  download_expires_at: string | null;
  manifest_hash: string | null;
  chain_hash: string | null;
  error_message: string | null;
}

@Injectable()
export class ExportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
    @Inject(QUEUE_SERVICE) private readonly queue: QueueService,
  ) {}

  async createExport(input: CreateExportInput): Promise<ExportJobResponse> {
    const ctx = this.tenantContext.require();
    const projectId = input.filters.project_id ?? ctx.projectId;

    const job = await this.prisma.exportJob.create({
      data: {
        organizationId: ctx.organizationId,
        projectId,
        requestedByUserId: ctx.userId,
        filters: input.filters as Prisma.InputJsonValue,
        status: ExportJobStatus.pending,
      },
    });

    const payload: ExportJobPayload = {
      exportJobId: job.id,
      organizationId: ctx.organizationId,
      projectId: projectId ?? undefined,
      filters: input.filters,
    };

    await this.queue.publish(EXPORT_QUEUE, payload, { jobId: job.id });

    return this.toResponse(job);
  }

  async getExport(exportId: string): Promise<ExportJobResponse> {
    const ctx = this.tenantContext.require();
    const job = await this.prisma.exportJob.findFirst({
      where: { id: exportId, organizationId: ctx.organizationId },
    });
    if (!job) {
      throw new NotFoundException('Export job not found');
    }
    return this.toResponse(job);
  }

  async listExports(limit = 20): Promise<ExportJobResponse[]> {
    const ctx = this.tenantContext.require();
    const jobs = await this.prisma.exportJob.findMany({
      where: { organizationId: ctx.organizationId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return jobs.map((job) => this.toResponse(job));
  }

  async markProcessing(exportJobId: string): Promise<void> {
    await this.prisma.exportJob.update({
      where: { id: exportJobId },
      data: { status: ExportJobStatus.processing },
    });
  }

  async markCompleted(
    exportJobId: string,
    update: {
      artifactKey: string;
      manifestHash: string;
      chainHash: string;
      traceCount: number;
      downloadExpiresAt: Date;
    },
  ): Promise<void> {
    await this.prisma.exportJob.update({
      where: { id: exportJobId },
      data: {
        status: ExportJobStatus.completed,
        artifactKey: update.artifactKey,
        manifestHash: update.manifestHash,
        chainHash: update.chainHash,
        traceCount: update.traceCount,
        downloadExpiresAt: update.downloadExpiresAt,
        completedAt: new Date(),
        errorMessage: null,
      },
    });
  }

  async markFailed(exportJobId: string, errorMessage: string): Promise<void> {
    await this.prisma.exportJob.update({
      where: { id: exportJobId },
      data: {
        status: ExportJobStatus.failed,
        errorMessage,
      },
    });
  }

  private toResponse(job: {
    id: string;
    status: ExportJobStatus;
    traceCount: number;
    createdAt: Date;
    completedAt: Date | null;
    downloadExpiresAt: Date | null;
    manifestHash: string | null;
    chainHash: string | null;
    errorMessage: string | null;
  }): ExportJobResponse {
    return {
      export_id: job.id,
      status: job.status,
      trace_count: job.traceCount,
      created_at: job.createdAt.toISOString(),
      completed_at: job.completedAt?.toISOString() ?? null,
      download_expires_at: job.downloadExpiresAt?.toISOString() ?? null,
      manifest_hash: job.manifestHash,
      chain_hash: job.chainHash,
      error_message: job.errorMessage,
    };
  }
}
