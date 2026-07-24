import { apiClient } from '../index';
import type { IncentivePlan, IncentivePayout } from '@bharatsales/shared-types';

export class IncentivesService {
  static async getIncentivePlans(): Promise<IncentivePlan[]> {
    // Mock data since backend module doesn't exist yet
    return Promise.resolve([]);
  }

  static async getIncentivePayouts(): Promise<IncentivePayout[]> {
    return Promise.resolve([]);
  }
}
