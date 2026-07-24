import { apiClient } from '../index';
import type { AppNotification } from '@bharatsales/shared-types';

export class NotificationsService {
  static async getNotifications(userId: string): Promise<AppNotification[]> {
    return Promise.resolve([]);
  }

  static async markAsRead(id: string): Promise<AppNotification> {
    return Promise.resolve({} as AppNotification);
  }

  static async markAllAsRead(userId: string): Promise<void> {
    return Promise.resolve();
  }
}
