import { apiClient } from '../index';
import type { Device, Session } from '@bharatsales/shared-types';

export class DevicesService {
  static async getDevices(): Promise<Device[]> {
    const response = await apiClient.get<Device[]>('/devices');
    return response.data;
  }

  static async getSessions(): Promise<Session[]> {
    const response = await apiClient.get<Session[]>('/sessions');
    return response.data;
  }
}
