import { apiClient } from '../index';
import type { Settings } from '@bharatsales/shared-types';

export interface OrgBranding {
  name: string;
  branding: { logoUrl?: string; primaryColor?: string };
}

export class SettingsService {
  static async getSettings(): Promise<Settings> {
    const response = await apiClient.get<Settings>('/settings');
    return response.data;
  }

  static async getBranding(): Promise<OrgBranding> {
    const response = await apiClient.get<OrgBranding>('/settings/branding');
    return response.data;
  }

  static async updateSettings(updates: Partial<Settings>): Promise<Settings> {
    const response = await apiClient.put<Settings>('/settings', updates);
    return response.data;
  }
}
