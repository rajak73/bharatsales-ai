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

  static async updateUser(id: string, data: Partial<User> & { password?: string }): Promise<User> {
    const response = await apiClient.put<User>(`/users/${id}`, data);
    return response.data;
  }

  static async deleteUser(id: string): Promise<{ deleted: boolean }> {
    const response = await apiClient.delete<{ deleted: boolean }>(`/users/${id}`);
    return response.data;
  }

  static async inviteUser(email: string, role: string): Promise<User> {
    const response = await apiClient.post<User>('/users/invites', { email, role });
    return response.data;
  }
}
