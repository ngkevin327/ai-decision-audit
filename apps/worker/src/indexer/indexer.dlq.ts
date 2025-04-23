import { Injectable, Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@api/prisma/prisma.service';
import type { TraceIndexJob } from '@api/ingest/ingest.publisher';
import { INDEXER_MAX_ATTEMPTS } from '../queue/retry.policy';

@Injectable()
export class IndexerDlqHandler {
  private readonly logger = new Logger(IndexerDlqHandler.name);

  constructor(private readonly prisma: PrismaService) {}

  async recordFailure(job: Job<TraceIndexJob> | undefined, error: Error): Promise<void> {
    if (!job || job.attemptsMade < INDEXER_MAX_ATTEMPTS) {
      return;
    }

    const payload = job.data;
    await this.prisma.indexJobDlq.create({
      data: {
        organizationId: payload.organizationId,
        traceId: payload.traceId,
        jobPayload: payload as unknown as Prisma.InputJsonValue,
        errorMessage: error.message,
        attemptCount: job.attemptsMade,
      },
    });

    this.logger.warn('index job moved to DLQ', {
      traceId: payload.traceId,
      attempts: job.attemptsMade,
    });
  }
}
