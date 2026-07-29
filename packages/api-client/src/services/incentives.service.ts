import { apiClient } from '../index';
import type { IncentivePlan, IncentivePayout } from '@bharatsales/shared-types';

export class IncentivesService {
  static async getIncentivePlans(): Promise<IncentivePlan[]> {
    const response = await apiClient.get<IncentivePlan[]>('/incentives/plans');
    return response.data;
  }

  static async getIncentivePayouts(): Promise<IncentivePayout[]> {
    const response = await apiClient.get<IncentivePayout[]>('/incentives/payouts');
    return response.data;
  }

  static async createIncentivePlan(data: Partial<IncentivePlan>): Promise<IncentivePlan> {
    const response = await apiClient.post<IncentivePlan>('/incentives/plans', data);
    return response.data;
  }
}
