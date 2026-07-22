import { apiClient } from '../index';
import type { IncentivePlan, IncentivePayout } from '@bharatsales/shared-types';

export class IncentivesService {
  static async getIncentivePlans(): Promise<IncentivePlan[]> {
    const response = await apiClient.get<IncentivePlan[]>('/incentive-plans');
    return response.data;
  }

  static async getIncentivePayouts(): Promise<IncentivePayout[]> {
    const response = await apiClient.get<IncentivePayout[]>('/incentive-payouts');
    return response.data;
  }
}
