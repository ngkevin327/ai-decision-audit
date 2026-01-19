import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PlanTier } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export const PLAN_MONTHLY_EVENT_LIMITS: Record<PlanTier, number> = {
  starter: 50_000,
  growth: 500_000,
  enterprise: 5_000_000,
};

export interface QuotaUsageSnapshot {
  plan_tier: PlanTier;
  monthly_limit: number;
  events_used: number;
  percent_used: number;
  warning_threshold: boolean;
  limit_reached: boolean;
  period_start: string;
  period_end: string;
}

@Injectable()
export class QuotaService {
  constructor(private readonly prisma: PrismaService) {}

  async getUsage(organizationId: string): Promise<QuotaUsageSnapshot> {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });
    if (!organization) {
      throw new HttpException('Organization not found', HttpStatus.NOT_FOUND);
    }

    const { periodStart, periodEnd } = currentBillingPeriod();
    const eventsUsed = await this.countEventsInPeriod(organizationId, periodStart, periodEnd);
    const monthlyLimit = PLAN_MONTHLY_EVENT_LIMITS[organization.planTier];
    const percentUsed = monthlyLimit > 0 ? (eventsUsed / monthlyLimit) * 100 : 0;

    return {
      plan_tier: organization.planTier,
      monthly_limit: monthlyLimit,
      events_used: eventsUsed,
      percent_used: Math.min(100, Math.round(percentUsed * 10) / 10),
      warning_threshold: percentUsed >= 80 && percentUsed < 100,
      limit_reached: eventsUsed >= monthlyLimit,
      period_start: periodStart.toISOString(),
      period_end: periodEnd.toISOString(),
    };
  }

  async enforceIngest(
    organizationId: string,
    incomingEventCount: number,
  ): Promise<QuotaUsageSnapshot> {
    const usage = await this.getUsage(organizationId);
    if (usage.events_used + incomingEventCount > usage.monthly_limit) {
      throw new HttpException(
        {
          message: 'Monthly event quota exceeded',
          quota: usage,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    void this.maybeSendQuotaWarning(organizationId, usage);
    return usage;
  }

  private async maybeSendQuotaWarning(organizationId: string, usage: QuotaUsageSnapshot) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { QuotaNotificationService } =
        require('./quota-notification.service') as typeof import('./quota-notification.service');
      const notifier = new QuotaNotificationService(this.prisma);
      await notifier.maybeSendQuotaWarning(organizationId, usage);
    } catch {
      // quota-notification.service is added in C10.4
    }
  }

  async countEventsInPeriod(
    organizationId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<number> {
    return this.prisma.event.count({
      where: {
        organizationId,
        createdAt: {
          gte: periodStart,
          lt: periodEnd,
        },
      },
    });
  }
}

function currentBillingPeriod(now = new Date()): { periodStart: Date; periodEnd: Date } {
  const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const periodEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return { periodStart, periodEnd };
}
