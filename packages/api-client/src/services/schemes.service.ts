import { apiClient } from '../index';
import type { Scheme } from '@bharatsales/shared-types';

export class SchemesService {
  static async getSchemes(): Promise<Scheme[]> {
    const response = await apiClient.get<Scheme[]>('/schemes');
    return response.data;
  }

  static async createScheme(data: Partial<Scheme>): Promise<Scheme> {
    const response = await apiClient.post<Scheme>('/schemes', data);
    return response.data;
  }
}
