import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { quotaWarningTemplate } from './templates/quota-warning';
import type { QuotaUsageSnapshot } from './quota.service';

@Injectable()
export class QuotaNotificationService {
  private readonly logger = new Logger(QuotaNotificationService.name);
  private readonly warnedPeriods = new Set<string>();

  constructor(private readonly prisma: PrismaService) {}

  async maybeSendQuotaWarning(organizationId: string, usage: QuotaUsageSnapshot): Promise<void> {
    if (!usage.warning_threshold || usage.limit_reached) {
      return;
    }

    const warnKey = `${organizationId}:${usage.period_start}`;
    if (this.warnedPeriods.has(warnKey)) {
      return;
    }

    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });
    if (!organization) {
      return;
    }

    const admin = await this.prisma.membership.findFirst({
      where: { organizationId, role: 'org_admin' },
      include: { user: true },
    });
    const to = admin?.user.email;
    if (!to) {
      this.logger.warn('no org_admin email for quota warning', { organizationId });
      return;
    }

    const { subject, html, text } = quotaWarningTemplate({
      to,
      organizationName: organization.name,
      eventsUsed: usage.events_used,
      monthlyLimit: usage.monthly_limit,
      percentUsed: usage.percent_used,
      periodEnd: usage.period_end,
    });

    await this.sendEmail(to, subject, html, text);
    this.warnedPeriods.add(warnKey);
    this.logger.log('quota warning email sent', {
      organizationId,
      percentUsed: usage.percent_used,
    });
  }

  private async sendEmail(to: string, subject: string, html: string, text: string): Promise<void> {
    const apiKey = process.env.SENDGRID_API_KEY;
    const from = process.env.SENDGRID_FROM_EMAIL ?? 'audit@example.com';

    if (!apiKey) {
      this.logger.warn('SENDGRID_API_KEY not set; skipping quota warning email', { to });
      return;
    }

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: from },
        subject,
        content: [
          { type: 'text/plain', value: text },
          { type: 'text/html', value: html },
        ],
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`SendGrid failed (${response.status}): ${body}`);
    }
  }
}
