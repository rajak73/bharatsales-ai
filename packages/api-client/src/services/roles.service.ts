import { apiClient } from '../index';
import type { Role } from '@bharatsales/shared-types';

export class RolesService {
  static async getRoles(): Promise<Role[]> {
    return Promise.resolve([]);
  }
}
