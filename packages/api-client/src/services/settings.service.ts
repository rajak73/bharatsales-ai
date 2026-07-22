import { apiClient } from '../index';
import type { Settings } from '@bharatsales/shared-types';

export class SettingsService {
  static async getSettings(): Promise<Settings> {
    const response = await apiClient.get<Settings>('/settings');
    return response.data;
  }

  static async updateSettings(updates: Partial<Settings>): Promise<Settings> {
    const response = await apiClient.patch<Settings>('/settings', updates);
    return response.data;
  }
}
