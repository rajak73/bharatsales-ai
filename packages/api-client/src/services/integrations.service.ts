import { apiClient } from '../index';
import type { Integration } from '@bharatsales/shared-types';

export class IntegrationsService {
  static async getIntegrations(organizationId: string): Promise<Integration[]> {
    const response = await apiClient.get<Integration[]>('/integrations', {
      params: { organizationId },
    });
    return response.data;
  }
}
