import { apiClient } from '../index';
import type { SalesTarget } from '@bharatsales/shared-types';

export class TargetsService {
  static async getTargets(organizationId: string): Promise<SalesTarget[]> {
    const response = await apiClient.get<SalesTarget[]>('/targets', {
      params: { organizationId },
    });
    return response.data;
  }

  static async createTarget(data: Partial<SalesTarget>): Promise<SalesTarget> {
    const response = await apiClient.post<SalesTarget>('/targets', data);
    return response.data;
  }
}
