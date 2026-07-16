import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NotificationLog } from '../schemas/notification.schema';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(@InjectModel(NotificationLog.name) private notificationModel: Model<NotificationLog>) {}

  async sendSms(organizationId: string, to: string, message: string) {
    this.logger.log(`Logging SMS to ${to}: ${message}`);
    const log = new this.notificationModel({
      organizationId,
      method: 'SMS',
      to,
      message,
      status: 'Sent'
    });
    await log.save();
    return { success: true, method: 'SMS', to, id: log._id };
  }

  async sendWhatsApp(organizationId: string, to: string, templateId: string, payload: any) {
    this.logger.log(`Logging WhatsApp to ${to} using template ${templateId}`);
    const log = new this.notificationModel({
      organizationId,
      method: 'WhatsApp',
      to,
      templateId,
      payload,
      status: 'Sent'
    });
    await log.save();
    return { success: true, method: 'WhatsApp', to, id: log._id };
  }
}
