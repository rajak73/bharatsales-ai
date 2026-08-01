import { apiClient } from '../index';
import type { LocationPing } from '@bharatsales/shared-types';

export class TrackingService {
  static async bulkCreatePings(pings: Partial<LocationPing>[]): Promise<{ success: boolean; count: number }> {
    const response = await apiClient.post('/tracking/bulk', { pings });
    return response.data;
  }

  static async getLatestPings(): Promise<LocationPing[]> {
    const response = await apiClient.get<LocationPing[]>('/tracking');
    return response.data;
  }
}
