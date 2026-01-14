import { Injectable } from '@nestjs/common';
import { PlanTier } from '@prisma/client';

export const PLAN_RETENTION_DAYS: Record<PlanTier, number> = {
  starter: 30,
  growth: 90,
  enterprise: 365,
};

@Injectable()
export class RetentionService {
  getRetentionDays(planTier: PlanTier): number {
    return PLAN_RETENTION_DAYS[planTier];
  }

  retentionCutoff(planTier: PlanTier, now = new Date()): Date {
    const days = this.getRetentionDays(planTier);
    const cutoff = new Date(now);
    cutoff.setUTCDate(cutoff.getUTCDate() - days);
    return cutoff;
  }

  isWithinRetention(startedAt: Date, planTier: PlanTier, now = new Date()): boolean {
    return startedAt >= this.retentionCutoff(planTier, now);
  }

  isExpired(startedAt: Date, planTier: PlanTier, now = new Date()): boolean {
    return !this.isWithinRetention(startedAt, planTier, now);
  }
}
