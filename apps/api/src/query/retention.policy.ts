import { PlanTier } from '@prisma/client';

export const PLAN_RETENTION_DAYS: Record<PlanTier, number> = {
  starter: 30,
  growth: 90,
  enterprise: 365,
};

export function retentionCutoff(planTier: PlanTier, now = new Date()): Date {
  const days = PLAN_RETENTION_DAYS[planTier];
  const cutoff = new Date(now);
  cutoff.setUTCDate(cutoff.getUTCDate() - days);
  return cutoff;
}

export function isWithinRetention(startedAt: Date, planTier: PlanTier, now = new Date()): boolean {
  return startedAt >= retentionCutoff(planTier, now);
}
