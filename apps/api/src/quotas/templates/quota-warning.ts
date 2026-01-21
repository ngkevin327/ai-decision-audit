export interface QuotaWarningEmailInput {
  to: string;
  organizationName: string;
  eventsUsed: number;
  monthlyLimit: number;
  percentUsed: number;
  periodEnd: string;
}

export function quotaWarningTemplate(input: QuotaWarningEmailInput): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `${input.organizationName} has used ${input.percentUsed}% of its monthly audit event quota`;
  const text = [
    `Your organization ${input.organizationName} has consumed ${input.eventsUsed.toLocaleString()} of ${input.monthlyLimit.toLocaleString()} audit events this month (${input.percentUsed}% used).`,
    'Ingest will be blocked when the quota is reached. Upgrade your plan or reduce ingest volume before the billing period ends.',
    `Current period ends: ${input.periodEnd}`,
  ].join('\n');

  const html = `
    <p>Your organization <strong>${input.organizationName}</strong> has consumed
    <strong>${input.eventsUsed.toLocaleString()}</strong> of
    <strong>${input.monthlyLimit.toLocaleString()}</strong> audit events this month
    (<strong>${input.percentUsed}%</strong> used).</p>
    <p>Ingest is blocked at 100%. Consider upgrading your plan before
    <strong>${input.periodEnd}</strong>.</p>
  `;

  return { subject, html, text };
}
