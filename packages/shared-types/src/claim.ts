export type ClaimStatus = 'Pending' | 'Approved' | 'Rejected' | 'Settled';

export interface Claim {
  id: string;
  organizationId: string;
  distributorId?: string;
  outletId?: string;
  claimNumber: string;
  type: 'Scheme' | 'Damage' | 'Expiry' | 'Price Difference' | 'Other';
  amount: number;
  status: ClaimStatus;
  reason?: string;
  referenceDocumentType?: 'Order' | 'Return' | 'Invoice';
  referenceDocumentId?: string;
  attachments?: string[];
  submittedByUserId: string;
  approvedByUserId?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}
