export interface PaymentCollection {
  id: string;
  organizationId: string;
  receiptNumber: string;
  invoiceId?: string; // Optional if it's an advance payment
  outletId: string;
  collectedByUserId: string;
  
  amount: number;
  paymentMode: 'Cash' | 'Cheque' | 'UPI' | 'Bank Transfer';
  referenceNumber?: string; // For Cheque or UPI
  
  status: 'Draft' | 'Submitted' | 'Pending_Verification' | 'Verified' | 'Rejected' | 'Reversed' | 'Pending' | 'Cleared' | 'Bounced';
  collectionDate: string;
  
  createdAt: string;
  updatedAt: string;
}
