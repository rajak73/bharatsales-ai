import { apiClient } from '../index';
import type { SubscriptionData } from '@bharatsales/shared-types';

export class SubscriptionService {
  static async getSubscriptionData(): Promise<SubscriptionData> {
    const response = await apiClient.get<SubscriptionData>('/subscriptions');
    return response.data;
  }

  static async upgradePlan(plan: 'Starter' | 'Growth' | 'Enterprise'): Promise<any> {
    const response = await apiClient.post('/subscriptions/upgrade', { plan });
    return response.data;
  }
}
