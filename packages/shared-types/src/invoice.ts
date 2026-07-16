export interface Invoice {
  id: string;
  organizationId: string;
  invoiceNumber: string;
  orderId: string;
  outletId: string;
  
  totalAmount: number;
  paidAmount: number;
  
  status: 'Unpaid' | 'Partial' | 'Paid' | 'Overdue';
  dueDate: string;
  
  createdAt: string;
  updatedAt: string;
}
