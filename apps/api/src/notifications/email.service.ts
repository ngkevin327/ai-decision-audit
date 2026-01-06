import { Injectable, Logger } from '@nestjs/common';
import { exportReadyTemplate, type ExportReadyEmailInput } from './templates/export-ready';

export type { ExportReadyEmailInput };

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  async sendExportReady(input: ExportReadyEmailInput): Promise<void> {
    const apiKey = process.env.SENDGRID_API_KEY;
    const from = process.env.SENDGRID_FROM_EMAIL ?? 'audit@example.com';
    const { subject, html, text } = exportReadyTemplate(input);

    if (!apiKey) {
      this.logger.warn('SENDGRID_API_KEY not set; skipping export ready email', {
        to: input.to,
        exportId: input.exportId,
      });
      return;
    }

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: input.to }] }],
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
