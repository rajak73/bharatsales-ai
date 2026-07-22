import { apiClient } from '../index';
import type { Role } from '@bharatsales/shared-types';

export class RolesService {
  static async getRoles(): Promise<Role[]> {
    const response = await apiClient.get<Role[]>('/roles');
    return response.data;
  }
}
