import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NotificationLog } from '../schemas/notification.schema';
import { AppNotification } from '../schemas/app-notification.schema';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private brevoApiKey = process.env.BREVO_API_KEY;
  private smsSender = process.env.BREVO_SMS_SENDER || 'BharatAI';

  constructor(
    @InjectModel(NotificationLog.name) private notificationModel: Model<NotificationLog>,
    @InjectModel(AppNotification.name) private appNotificationModel: Model<AppNotification>,
  ) {}

  async create(organizationId: string, userId: string, data: { type: string; title: string; message: string }) {
    const notification = new this.appNotificationModel({
      organizationId,
      userId,
      type: data.type,
      title: data.title,
      message: data.message,
      time: new Date().toISOString(),
      read: false
    });
    return notification.save();
  }

  async getNotifications(organizationId: string, userId: string) {
    return this.appNotificationModel.find({ organizationId, userId }).sort({ createdAt: -1 }).exec();
  }

  async markAsRead(organizationId: string, userId: string, notificationId: string) {
    return this.appNotificationModel.findOneAndUpdate(
      { _id: notificationId, organizationId, userId },
      { read: true },
      { new: true }
    ).exec();
  }

  async markAllAsRead(organizationId: string, userId: string) {
    await this.appNotificationModel.updateMany(
      { organizationId, userId, read: false },
      { read: true }
    ).exec();
    return { success: true };
  }

  // Real integration: Brevo's transactional SMS API
  // (https://api.brevo.com/v3/transactionalSMS/sms). Falls back to a
  // log-only "Sent" record when BREVO_API_KEY isn't set, same as this
  // method's previous stub behavior.
  async sendSms(organizationId: string, to: string, message: string) {
    let status: 'Sent' | 'Failed' = 'Sent';

    if (this.brevoApiKey) {
      try {
        const response = await fetch('https://api.brevo.com/v3/transactionalSMS/sms', {
          method: 'POST',
          headers: { 'api-key': this.brevoApiKey, 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            sender: this.smsSender,
            recipient: to.replace(/[^\d]/g, ''),
            content: message,
            type: 'transactional',
          }),
        });
        if (!response.ok) {
          const errorBody = await response.text().catch(() => '');
          this.logger.error(`Brevo SMS send failed (${response.status}): ${errorBody}`);
          status = 'Failed';
        } else {
          this.logger.log(`Sent SMS to ${to} via Brevo`);
        }
      } catch (err) {
        this.logger.error('Brevo SMS send threw an error', err as Error);
        status = 'Failed';
      }
    } else {
      this.logger.debug(`[Development Mode] SMS to ${to}: ${message}`);
    }

    const log = new this.notificationModel({ organizationId, method: 'SMS', to, message, status });
    await log.save();
    return { success: status === 'Sent', method: 'SMS', to, id: log._id };
  }

  // Real integration: Brevo's WhatsApp Business API
  // (https://api.brevo.com/v3/whatsapp/sendMessage). Requires a WhatsApp
  // Business sender + template already approved in the Brevo account —
  // templateId/payload here map directly to that template's id and params.
  async sendWhatsApp(organizationId: string, to: string, templateId: string, payload: any) {
    let status: 'Sent' | 'Failed' = 'Sent';

    if (this.brevoApiKey) {
      try {
        const response = await fetch('https://api.brevo.com/v3/whatsapp/sendMessage', {
          method: 'POST',
          headers: { 'api-key': this.brevoApiKey, 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            to: to.replace(/[^\d]/g, ''),
            templateId,
            params: payload,
          }),
        });
        if (!response.ok) {
          const errorBody = await response.text().catch(() => '');
          this.logger.error(`Brevo WhatsApp send failed (${response.status}): ${errorBody}`);
          status = 'Failed';
        } else {
          this.logger.log(`Sent WhatsApp to ${to} via Brevo using template ${templateId}`);
        }
      } catch (err) {
        this.logger.error('Brevo WhatsApp send threw an error', err as Error);
        status = 'Failed';
      }
    } else {
      this.logger.debug(`[Development Mode] WhatsApp to ${to} using template ${templateId}`);
    }

    const log = new this.notificationModel({ organizationId, method: 'WhatsApp', to, templateId, payload, status });
    await log.save();
    return { success: status === 'Sent', method: 'WhatsApp', to, id: log._id };
  }
}
