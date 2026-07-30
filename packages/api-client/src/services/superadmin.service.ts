import { apiClient } from '../index';
import type { Tenant } from '@bharatsales/shared-types';

export class SuperadminService {
  static async getPlatformDashboard(): Promise<any> {
    const response = await apiClient.get('/superadmin/dashboard');
    return response.data;
  }

  static async getAllTenants(): Promise<(Tenant & { userCount: number })[]> {
    const response = await apiClient.get<(Tenant & { userCount: number })[]>('/superadmin/tenants');
    return response.data;
  }

  static async updateTenantStatus(id: string, status: string): Promise<Tenant> {
    const response = await apiClient.patch<Tenant>(`/superadmin/tenants/${id}/status`, { status });
    return response.data;
  }

  static async createTenant(data: Partial<Tenant>): Promise<Tenant> {
    const response = await apiClient.post<Tenant>('/superadmin/tenants', data);
    return response.data;
  }

  static async updateSubscription(id: string, data: { plan?: string; billingCycle?: string; subscriptionUsersLimit?: number }): Promise<Tenant> {
    const response = await apiClient.patch<Tenant>(`/superadmin/tenants/${id}/subscription`, data);
    return response.data;
  }

  static async addBillingRecord(id: string, data: { amount: string; plan: string; status?: string }): Promise<Tenant> {
    const response = await apiClient.post<Tenant>(`/superadmin/tenants/${id}/billing`, data);
    return response.data;
  }

  static async getAllUsers(filters?: { role?: string; organizationId?: string; status?: string }): Promise<any[]> {
    const response = await apiClient.get('/superadmin/users', { params: filters });
    return response.data;
  }

  static async getPlatformAnalytics(): Promise<any> {
    const response = await apiClient.get('/superadmin/analytics');
    return response.data;
  }

  static async getAllTickets(): Promise<any[]> {
    const response = await apiClient.get('/superadmin/tickets');
    return response.data;
  }

  static async updateTicketStatus(id: string, status: string): Promise<any> {
    const response = await apiClient.patch(`/superadmin/tickets/${id}/status`, { status });
    return response.data;
  }

  static async getPlatformSettings(): Promise<any> {
    const response = await apiClient.get('/superadmin/settings');
    return response.data;
  }

  static async updatePlatformSettings(data: any): Promise<any> {
    const response = await apiClient.patch('/superadmin/settings', data);
    return response.data;
  }

  static async getGlobalAuditLogs(): Promise<any[]> {
    const response = await apiClient.get('/superadmin/audit');
    return response.data;
  }

  static async getMetrics(): Promise<any> {
    const response = await apiClient.get('/superadmin/metrics');
    return response.data;
  }
}
