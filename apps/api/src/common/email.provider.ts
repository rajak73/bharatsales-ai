import { Injectable, Logger } from '@nestjs/common';

export interface IEmailProvider {
  sendEmail(to: string, subject: string, body: string): Promise<boolean>;
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
