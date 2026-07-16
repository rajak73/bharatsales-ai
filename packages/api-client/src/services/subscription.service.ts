import { apiClient } from '../index';
import type { SubscriptionData } from '@bharatsales/shared-types';

export class SubscriptionService {
  static async getSubscriptionData(organizationId: string): Promise<SubscriptionData> {
    const response = await apiClient.get<SubscriptionData>('/subscription', {
      params: { organizationId },
    });
    return response.data;
  }
}
