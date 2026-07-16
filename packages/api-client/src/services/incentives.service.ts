import { apiClient } from '../index';
import type { IncentivePlan, IncentivePayout } from '@bharatsales/shared-types';

export class IncentivesService {
  static async getIncentivePlans(organizationId: string): Promise<IncentivePlan[]> {
    const response = await apiClient.get<IncentivePlan[]>('/incentive-plans', {
      params: { organizationId },
    });
    return response.data;
  }

  static async getIncentivePayouts(organizationId: string): Promise<IncentivePayout[]> {
    const response = await apiClient.get<IncentivePayout[]>('/incentive-payouts', {
      params: { organizationId },
    });
    return response.data;
  }
}
