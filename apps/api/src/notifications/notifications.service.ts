import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NotificationLog } from '../schemas/notification.schema';
import { AppNotification } from '../schemas/app-notification.schema';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectModel(NotificationLog.name) private notificationModel: Model<NotificationLog>,
    @InjectModel(AppNotification.name) private appNotificationModel: Model<AppNotification>,
  ) {}

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
