import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Worker, type Job } from 'bullmq';
import IORedis from 'ioredis';
import { AppConfigService } from '@api/config/config.service';
import { INDEXER_QUEUE } from '@api/queue/queue.interface';
import type { TraceIndexJob } from '@api/ingest/ingest.publisher';
import { INDEXER_RETRY_POLICY } from '../queue/retry.policy';
import { IndexerDlqHandler } from './indexer.dlq';
import { IndexerService } from './indexer.service';

@Injectable()
export class IndexerConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(IndexerConsumer.name);
  private worker?: Worker<TraceIndexJob>;
  private connection?: IORedis;

  constructor(
    private readonly config: AppConfigService,
    private readonly indexerService: IndexerService,
    private readonly dlqHandler: IndexerDlqHandler,
  ) {}

  async onModuleInit() {
    this.connection = new IORedis(this.config.redisUrl, { maxRetriesPerRequest: null });
    this.worker = new Worker<TraceIndexJob>(INDEXER_QUEUE, async (job) => this.handleJob(job), {
      connection: this.connection,
      ...INDEXER_RETRY_POLICY,
    });
    this.worker.on('failed', async (job, err) => {
      this.logger.error('index job failed', {
        jobId: job?.id,
        traceId: job?.data.traceId,
        error: err.message,
      });
      await this.dlqHandler.recordFailure(job, err);
    });
    this.logger.log('indexer consumer started', { queue: INDEXER_QUEUE });
  }

  async onModuleDestroy() {
    await this.worker?.close();
    await this.connection?.quit();
  }

  private async handleJob(job: Job<TraceIndexJob>) {
    await this.indexerService.processIndexJob(job.data);
  }
}
