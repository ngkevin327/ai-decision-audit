import { Injectable, Logger, Module, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PlanTier } from '@prisma/client';
import { AppConfigModule } from '@api/config/config.module';
import { PrismaModule } from '@api/prisma/prisma.module';
import { PrismaService } from '@api/prisma/prisma.service';

const COMPACTION_INTERVAL_MS = 60 * 60 * 1000;
const BATCH_SIZE = 200;

@Injectable()
export class RetentionCompactionJob implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RetentionCompactionJob.name);
  private timer?: ReturnType<typeof setInterval>;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    this.timer = setInterval(() => {
      void this.runCompaction();
    }, COMPACTION_INTERVAL_MS);
    void this.runCompaction();
    this.logger.log('retention compaction scheduler started');
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  async runCompaction(): Promise<number> {
    const organizations = await this.prisma.organization.findMany({
      select: { id: true, planTier: true },
    });

    let deleted = 0;
    for (const org of organizations) {
      deleted += await this.compactOrganization(org.id, org.planTier);
    }

    if (deleted > 0) {
      this.logger.log('retention compaction removed expired traces', { deleted });
    }
    return deleted;
  }

  private async compactOrganization(organizationId: string, planTier: PlanTier): Promise<number> {
    const retention = this.loadRetentionService();
    const cutoff = retention.retentionCutoff(planTier);
    let removed = 0;

    for (;;) {
      const expired = await this.prisma.trace.findMany({
        where: {
          organizationId,
          startedAt: { lt: cutoff },
        },
        select: { id: true },
        take: BATCH_SIZE,
      });

      if (expired.length === 0) {
        break;
      }

      const result = await this.prisma.trace.deleteMany({
        where: { id: { in: expired.map((trace) => trace.id) } },
      });
      removed += result.count;
    }

    return removed;
  }

  private loadRetentionService() {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { RetentionService } =
        require('@api/retention/retention.service') as typeof import('@api/retention/retention.service');
      return new RetentionService();
    } catch {
      return {
        retentionCutoff: (planTier: PlanTier) => {
          const days =
            planTier === PlanTier.enterprise ? 365 : planTier === PlanTier.growth ? 90 : 30;
          const cutoff = new Date();
          cutoff.setUTCDate(cutoff.getUTCDate() - days);
          return cutoff;
        },
      };
    }
  }
}

@Module({
  imports: [AppConfigModule, PrismaModule],
  providers: [RetentionCompactionJob],
})
export class RetentionWorkerModule {}
