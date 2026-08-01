import { apiClient } from '../index';
import type { AppNotification } from '@bharatsales/shared-types';

export class NotificationsService {
  static async getNotifications(userId: string): Promise<AppNotification[]> {
    const { data } = await apiClient.get('/notifications');
    return data;
  }

  static async markAsRead(id: string): Promise<AppNotification> {
    const { data } = await apiClient.put(`/notifications/${id}/read`);
    return data;
  }

  static async markAllAsRead(userId: string): Promise<void> {
    await apiClient.put('/notifications/read-all');
  }

  static async sendSms(to: string, message: string): Promise<any> {
    const { data } = await apiClient.post('/notifications/sms', { to, message });
    return data;
  }

  static async sendWhatsApp(to: string, templateId: string, payload: any): Promise<any> {
    const { data } = await apiClient.post('/notifications/whatsapp', { to, templateId, payload });
    return data;
  }
}
