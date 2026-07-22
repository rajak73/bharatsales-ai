import { apiClient } from '../index';
import type { User } from '@bharatsales/shared-types';

export class UsersService {
  static async getUsers(): Promise<User[]> {
    const response = await apiClient.get<User[]>('/users');
    return response.data;
  }

  static async createUser(data: Partial<User>): Promise<User> {
    const response = await apiClient.post<User>('/users', data);
    return response.data;
  }
}
