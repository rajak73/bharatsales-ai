import { apiClient } from '../index';
import type { AppNotification } from '@bharatsales/shared-types';

export class NotificationsService {
  static async getNotifications(userId: string): Promise<AppNotification[]> {
    const response = await apiClient.get<AppNotification[]>('/notifications', {
      params: { userId },
    });
    return response.data;
  }

  static async markAsRead(id: string): Promise<AppNotification> {
    const response = await apiClient.patch<AppNotification>(`/notifications/${id}/read`);
    return response.data;
  }

  static async markAllAsRead(userId: string): Promise<void> {
    await apiClient.post(`/notifications/mark-all-read`, { userId });
  }
}
