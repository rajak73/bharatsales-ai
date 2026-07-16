import { apiClient } from '../index';
import type { Approval, ApprovalRule } from '@bharatsales/shared-types';

export class ApprovalsService {
  static async getApprovals(organizationId: string): Promise<Approval[]> {
    const response = await apiClient.get<Approval[]>('/approvals', {
      params: { organizationId },
    });
    return response.data;
  }

  static async getApprovalRules(organizationId: string): Promise<ApprovalRule[]> {
    const response = await apiClient.get<ApprovalRule[]>('/approvals/rules', {
      params: { organizationId },
    });
    return response.data;
  }
}
