import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '@api/prisma/prisma.service';
import { INDEXER_QUEUE, QUEUE_SERVICE, type QueueService } from '@api/queue/queue.interface';

@Injectable()
export class WorkerBootstrapService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(QUEUE_SERVICE) private readonly queue: QueueService,
  ) {}

  async onModuleInit() {
    await this.prisma.$queryRaw`SELECT 1`;
    const queueReady = await this.queue.ping();
    if (!queueReady) {
      throw new Error('Queue connection failed during worker startup');
    }
    console.log('[worker] connected to database and queue', { queue: INDEXER_QUEUE });
  }
}
