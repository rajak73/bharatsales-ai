import { apiClient } from '../index';
import type { Role } from '@bharatsales/shared-types';

export class RolesService {
  static async getRoles(organizationId: string): Promise<Role[]> {
    const response = await apiClient.get<Role[]>('/roles', {
      params: { organizationId },
    });
    return response.data;
  }
}
