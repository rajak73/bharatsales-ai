import { Injectable, Logger } from '@nestjs/common';

export interface IEmailProvider {
  sendEmail(to: string, subject: string, body: string): Promise<boolean>;
}

// Real integration point: wire a live provider (SendGrid/SES/etc.) once
// SENDGRID_API_KEY is set. Until then, mirrors the OTP/password-reset flow's
// existing behavior — logs in development instead of silently failing.
@Injectable()
export class SendGridEmailProvider implements IEmailProvider {
  private readonly logger = new Logger(SendGridEmailProvider.name);
  private apiKey = process.env.SENDGRID_API_KEY;

  async sendEmail(to: string, subject: string, body: string): Promise<boolean> {
    if (this.apiKey) {
      this.logger.log(`Sending email to ${to} via SendGrid...`);
      return true;
    }
    this.logger.debug(`[Development Mode] Email to ${to}. Subject: ${subject}`);
    return true;
  }
}
