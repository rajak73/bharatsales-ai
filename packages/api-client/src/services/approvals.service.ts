import { apiClient } from '../index';
import type { Approval, ApprovalRule } from '@bharatsales/shared-types';

export class ApprovalsService {
  static async getApprovals(): Promise<Approval[]> {
    const response = await apiClient.get<Approval[]>('/approvals');
    return response.data;
  }

  static async createApproval(data: Partial<Approval>): Promise<Approval> {
    const response = await apiClient.post<Approval>('/approvals', data);
    return response.data;
  }

  static async updateApproval(id: string, data: Partial<Approval>): Promise<Approval> {
    const response = await apiClient.put<Approval>(`/approvals/${id}`, data);
    return response.data;
  }

  static async deleteApproval(id: string): Promise<{ deleted: boolean }> {
    const response = await apiClient.delete<{ deleted: boolean }>(`/approvals/${id}`);
    return response.data;
  }

  static async getApprovalRules(): Promise<ApprovalRule[]> {
    const response = await apiClient.get<ApprovalRule[]>('/approvals/rules');
    return response.data;
  }

  static async createApprovalRule(data: Partial<ApprovalRule>): Promise<ApprovalRule> {
    const response = await apiClient.post<ApprovalRule>('/approvals/rules', data);
    return response.data;
  }

  static async updateApprovalRule(id: string, data: Partial<ApprovalRule>): Promise<ApprovalRule> {
    const response = await apiClient.put<ApprovalRule>(`/approvals/rules/${id}`, data);
    return response.data;
  }

  static async deleteApprovalRule(id: string): Promise<{ deleted: boolean }> {
    const response = await apiClient.delete<{ deleted: boolean }>(`/approvals/rules/${id}`);
    return response.data;
  }
}
