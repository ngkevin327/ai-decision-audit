import { Inject, Injectable } from '@nestjs/common';
import { INDEXER_QUEUE, QUEUE_SERVICE, type QueueService } from '../queue/queue.interface';

export interface TraceIndexJob {
  traceId: string;
  organizationId: string;
  projectId: string;
  enqueuedAt: string;
}

@Injectable()
export class IngestPublisher {
  constructor(@Inject(QUEUE_SERVICE) private readonly queue: QueueService) {}

  async publishIndexJob(job: TraceIndexJob): Promise<string> {
    return this.queue.publish(INDEXER_QUEUE, job, { jobId: job.traceId });
  }
}
