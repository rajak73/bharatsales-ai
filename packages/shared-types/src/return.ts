export interface ReturnOrder {
  id: string;
  organizationId: string;
  orderId: string;
  outlet: string;
  reason: string;
  value: string;
  status: 'Draft' | 'Submitted' | 'Pending_Approval' | 'Approved' | 'Received' | 'Inspected' | 'Closed' | 'Rejected' | 'Cancelled';
  items?: { product: string; qty: number }[];
  managerApprovedBy?: string;
  financeApprovedBy?: string;
  createdAt: string;
  updatedAt: string;
}
