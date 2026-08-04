import { Injectable, Logger } from '@nestjs/common';

export interface IEmailProvider {
  sendEmail(to: string, subject: string, body: string): Promise<boolean>;
}

// Brevo's API field is literally named `htmlContent` — every caller of
// sendEmail() should pass real HTML through this helper rather than a raw
// string, so links render as clickable buttons instead of bare plain text.
export function renderEmailHtml(heading: string, message: string, cta?: { label: string; url: string }): string {
  const ctaHtml = cta
    ? `<div style="text-align:center;margin:32px 0;">
         <a href="${cta.url}" style="background:#2563EB;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 28px;border-radius:8px;display:inline-block;">${cta.label}</a>
       </div>
       <p style="color:#6B7280;font-size:13px;line-height:1.5;word-break:break-all;">If the button doesn't work, copy and paste this link into your browser:<br/><a href="${cta.url}" style="color:#2563EB;">${cta.url}</a></p>`
    : '';

  return `
    <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
      <div style="text-align:center;margin-bottom:24px;">
        <span style="font-size:20px;font-weight:800;color:#111827;">BharatSales AI</span>
      </div>
      <h1 style="font-size:18px;font-weight:700;color:#111827;margin:0 0 12px;">${heading}</h1>
      <p style="color:#374151;font-size:14px;line-height:1.6;margin:0;">${message}</p>
      ${ctaHtml}
      <p style="color:#9CA3AF;font-size:12px;margin-top:32px;text-align:center;">This is an automated message from BharatSales AI. If you didn't expect this email, you can safely ignore it.</p>
    </div>`;
}

// Real integration: Brevo's transactional email API
// (https://api.brevo.com/v3/smtp/email). Falls back to logging when
// BREVO_API_KEY isn't set — same dev-mode behavior this provider always had.
@Injectable()
export class BrevoEmailProvider implements IEmailProvider {
  private readonly logger = new Logger(BrevoEmailProvider.name);
  private apiKey = process.env.BREVO_API_KEY;
  private senderEmail = process.env.BREVO_SENDER_EMAIL;
  private senderName = process.env.BREVO_SENDER_NAME || 'BharatSales AI';

  async sendEmail(to: string, subject: string, body: string): Promise<boolean> {
    if (!this.apiKey) {
      this.logger.debug(`[Development Mode] Email to ${to}. Subject: ${subject}`);
      return true;
    }

    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': this.apiKey,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          sender: { email: this.senderEmail, name: this.senderName },
          to: [{ email: to }],
          subject,
          htmlContent: body,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        this.logger.error(`Brevo email send failed (${response.status}): ${errorBody}`);
        return false;
      }

      this.logger.log(`Sent email to ${to} via Brevo`);
      return true;
    } catch (err) {
      this.logger.error('Brevo email send threw an error', err as Error);
      return false;
    }
  }
}
