export interface Approval {
  id: string;
  organizationId: string;
  type: string;
  order: string;
  outlet: string;
  amount: number;
  requestedBy: string;
  reason: string;
  date: string;
  priority: string;
  status: string;
}

export interface ApprovalRule {
  organizationId: string;
  trigger: string;
  approver: string;
  enabled: boolean;
}
