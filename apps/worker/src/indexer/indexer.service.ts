import { Injectable, Logger } from '@nestjs/common';
import type { TraceIndexJob } from '@api/ingest/ingest.publisher';

@Injectable()
export class IndexerService {
  private readonly logger = new Logger(IndexerService.name);

  async processIndexJob(job: TraceIndexJob): Promise<void> {
    this.logger.log('index job received', {
      traceId: job.traceId,
      organizationId: job.organizationId,
    });
  }
}
