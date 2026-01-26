import { HttpException } from '@nestjs/common';
import { PlanTier } from '@prisma/client';
import { RetentionService } from '../../src/retention/retention.service';
import { QuotaService, PLAN_MONTHLY_EVENT_LIMITS } from '../../src/quotas/quota.service';
import { QuotaNotificationService } from '../../src/quotas/quota-notification.service';

describe('RetentionService', () => {
  const retention = new RetentionService();

  it('applies 30-day retention for starter tier', () => {
    const now = new Date('2026-05-20T12:00:00Z');
    const cutoff = retention.retentionCutoff(PlanTier.starter, now);
    expect(cutoff.toISOString()).toBe('2026-04-20T12:00:00.000Z');
  });

  it('treats traces before cutoff as expired', () => {
    const startedAt = new Date('2026-01-01T00:00:00Z');
    expect(retention.isExpired(startedAt, PlanTier.starter, new Date('2026-05-20T00:00:00Z'))).toBe(
      true,
    );
  });

  it('keeps traces within retention window', () => {
    const startedAt = new Date('2026-05-10T00:00:00Z');
    expect(
      retention.isWithinRetention(startedAt, PlanTier.starter, new Date('2026-05-20T00:00:00Z')),
    ).toBe(true);
  });
});

describe('QuotaService', () => {
  const prisma = {
    organization: { findUnique: jest.fn() },
    event: { count: jest.fn() },
  };
  const quota = new QuotaService(prisma as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('blocks ingest when monthly quota would be exceeded', async () => {
    prisma.organization.findUnique.mockResolvedValue({
      id: 'org-1',
      planTier: PlanTier.starter,
    });
    prisma.event.count.mockResolvedValue(PLAN_MONTHLY_EVENT_LIMITS.starter);

    await expect(quota.enforceIngest('org-1', 1)).rejects.toBeInstanceOf(HttpException);
  });

  it('returns warning threshold at eighty percent usage', async () => {
    prisma.organization.findUnique.mockResolvedValue({
      id: 'org-1',
      planTier: PlanTier.starter,
    });
    prisma.event.count.mockResolvedValue(Math.floor(PLAN_MONTHLY_EVENT_LIMITS.starter * 0.82));

    const usage = await quota.getUsage('org-1');
    expect(usage.warning_threshold).toBe(true);
    expect(usage.limit_reached).toBe(false);
  });
});

describe('QuotaNotificationService', () => {
  it('sends quota warning email at eighty percent threshold', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true });
    global.fetch = fetchMock as typeof fetch;
    process.env.SENDGRID_API_KEY = 'test-key';
    process.env.SENDGRID_FROM_EMAIL = 'audit@example.com';

    const prisma = {
      organization: { findUnique: jest.fn().mockResolvedValue({ id: 'org-1', name: 'Acme' }) },
      membership: {
        findFirst: jest.fn().mockResolvedValue({
          user: { email: 'admin@acme.test' },
        }),
      },
    };

    const notifications = new QuotaNotificationService(prisma as never);
    await notifications.maybeSendQuotaWarning('org-1', {
      plan_tier: PlanTier.starter,
      monthly_limit: 50_000,
      events_used: 41_000,
      percent_used: 82,
      warning_threshold: true,
      limit_reached: false,
      period_start: '2026-05-01T00:00:00.000Z',
      period_end: '2026-06-01T00:00:00.000Z',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.sendgrid.com/v3/mail/send',
      expect.objectContaining({ method: 'POST' }),
    );
  });
});
