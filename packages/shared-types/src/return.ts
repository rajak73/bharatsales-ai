export interface ReturnOrder {
  id: string;
  organizationId: string;
  orderId: string;
  outlet: string;
  reason: string;
  value: string;
  status: 'Pending Approval' | 'Approved' | 'Rejected' | 'Processed';
  items?: { product: string; qty: number }[];
  createdAt: string;
  updatedAt: string;
}
