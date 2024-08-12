import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { AppConfigService } from '../config/config.service';
import type { QueuePublishOptions, QueueService } from './queue.interface';

@Injectable()
export class BullmqQueueService implements QueueService, OnModuleDestroy {
  private readonly connection: IORedis;
  private readonly queues = new Map<string, Queue>();

  constructor(private readonly config: AppConfigService) {
    this.connection = new IORedis(config.redisUrl, { maxRetriesPerRequest: null });
  }

  private getQueue(name: string): Queue {
    let queue = this.queues.get(name);
    if (!queue) {
      queue = new Queue(name, { connection: this.connection });
      this.queues.set(name, queue);
    }
    return queue;
  }

  async publish<T>(
    queueName: string,
    payload: T,
    options?: QueuePublishOptions,
  ): Promise<string> {
    const job = await this.getQueue(queueName).add('process', payload, {
      jobId: options?.jobId,
      removeOnComplete: 1000,
      removeOnFail: 5000,
    });
    return job.id ?? 'unknown';
  }

  async ping(): Promise<boolean> {
    const result = await this.connection.ping();
    return result === 'PONG';
  }

  async onModuleDestroy() {
    await Promise.all([...this.queues.values()].map((q) => q.close()));
    await this.connection.quit();
  }
}
