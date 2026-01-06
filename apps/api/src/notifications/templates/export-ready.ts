export interface ExportReadyEmailInput {
  to: string;
  exportId: string;
  organizationName: string;
  traceCount: number;
  downloadUrl?: string;
}

export function exportReadyTemplate(input: ExportReadyEmailInput): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `Audit export ${input.exportId} is ready`;
  const linkLine = input.downloadUrl
    ? `Download (expires in 24h): ${input.downloadUrl}`
    : 'Sign in to the Audit Trail console to download your export package.';

  const text = [
    `Your audit export for ${input.organizationName} is ready.`,
    `Export ID: ${input.exportId}`,
    `Traces included: ${input.traceCount}`,
    linkLine,
  ].join('\n');

  const html = `
    <p>Your audit export for <strong>${input.organizationName}</strong> is ready.</p>
    <ul>
      <li>Export ID: <code>${input.exportId}</code></li>
      <li>Traces included: ${input.traceCount}</li>
    </ul>
    <p>${input.downloadUrl ? `<a href="${input.downloadUrl}">Download export package</a> (expires in 24 hours).` : 'Open the Audit Trail console to download your export package.'}</p>
  `;

  return { subject, html, text };
}
