import { apiClient } from '../index';
import type { Device, Session } from '@bharatsales/shared-types';

export class DevicesService {
  static async getDevices(organizationId: string): Promise<Device[]> {
    const response = await apiClient.get<Device[]>('/devices', {
      params: { organizationId },
    });
    return response.data;
  }

  static async getSessions(organizationId: string): Promise<Session[]> {
    const response = await apiClient.get<Session[]>('/sessions', {
      params: { organizationId },
    });
    return response.data;
  }
}
