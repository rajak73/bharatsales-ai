import { apiClient } from '../index';
import type { Approval, ApprovalRule } from '@bharatsales/shared-types';

export class ApprovalsService {
  static async getApprovals(): Promise<Approval[]> {
    const response = await apiClient.get<Approval[]>('/approvals');
    return response.data;
  }

  static async getApprovalRules(): Promise<ApprovalRule[]> {
    const response = await apiClient.get<ApprovalRule[]>('/approvals/rules');
    return response.data;
  }
}
