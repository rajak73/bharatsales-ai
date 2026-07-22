import { apiClient } from '../index';
import type { Integration } from '@bharatsales/shared-types';

export class IntegrationsService {
  static async getIntegrations(): Promise<Integration[]> {
    const response = await apiClient.get<Integration[]>('/integrations');
    return response.data;
  }
}
