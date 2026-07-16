import { apiClient } from '../index';
import type { Dispatch } from '@bharatsales/shared-types';

export class DispatchService {
  static async getDispatches(organizationId: string): Promise<Dispatch[]> {
    const response = await apiClient.get<Dispatch[]>('/dispatch', {
      params: { organizationId },
    });
    return response.data;
  }

  static async createDispatch(data: Partial<Dispatch>): Promise<Dispatch> {
    const response = await apiClient.post<Dispatch>('/dispatch', data);
    return response.data;
  }
}
