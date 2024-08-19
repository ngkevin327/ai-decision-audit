import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QUEUE_SERVICE, type QueueService } from '../queue/queue.interface';
import { STORAGE_SERVICE, type StorageService } from '../storage/storage.interface';

export interface DependencyStatus {
  status: 'up' | 'down';
  latencyMs?: number;
}

export interface HealthReport {
  status: 'ok' | 'degraded';
  service: string;
  timestamp: string;
  dependencies: {
    database: DependencyStatus;
    storage: DependencyStatus;
    queue: DependencyStatus;
  };
}

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(STORAGE_SERVICE) private readonly storage: StorageService,
    @Inject(QUEUE_SERVICE) private readonly queue: QueueService,
  ) {}

  async check(): Promise<HealthReport> {
    const [database, storage, queue] = await Promise.all([
      this.probeDatabase(),
      this.probeStorage(),
      this.probeQueue(),
    ]);

    const allUp =
      database.status === 'up' && storage.status === 'up' && queue.status === 'up';

    return {
      status: allUp ? 'ok' : 'degraded',
      service: 'api',
      timestamp: new Date().toISOString(),
      dependencies: { database, storage, queue },
    };
  }

  private async probeDatabase(): Promise<DependencyStatus> {
    const start = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'up', latencyMs: Date.now() - start };
    } catch {
      return { status: 'down' };
    }
  }

  private async probeStorage(): Promise<DependencyStatus> {
    const start = Date.now();
    try {
      const probeKey = `_health/${Date.now()}`;
      await this.storage.put({ key: probeKey, body: 'ok', contentType: 'text/plain' });
      await this.storage.get(probeKey);
      return { status: 'up', latencyMs: Date.now() - start };
    } catch {
      return { status: 'down' };
    }
  }

  private async probeQueue(): Promise<DependencyStatus> {
    const start = Date.now();
    try {
      const ok = await this.queue.ping();
      return ok
        ? { status: 'up', latencyMs: Date.now() - start }
        : { status: 'down' };
    } catch {
      return { status: 'down' };
    }
  }
}
