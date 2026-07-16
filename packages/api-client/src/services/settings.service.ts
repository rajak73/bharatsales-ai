import { apiClient } from '../index';
import type { Settings } from '@bharatsales/shared-types';

export class SettingsService {
  static async getSettings(organizationId: string): Promise<Settings> {
    const response = await apiClient.get<Settings>('/settings', {
      params: { organizationId },
    });
    return response.data;
  }

  static async updateSettings(organizationId: string, updates: Partial<Settings>): Promise<Settings> {
    const response = await apiClient.patch<Settings>('/settings', updates, {
      params: { organizationId },
    });
    return response.data;
  }
}
