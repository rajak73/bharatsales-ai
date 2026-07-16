export interface Expense {
  id: string;
  organizationId: string;
  userId: string;
  repName: string; // For display purposes
  date: string;
  type: 'Travel' | 'Food' | 'Accommodation' | 'Miscellaneous';
  amount: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  description: string;
  createdAt: string;
  updatedAt: string;
}
