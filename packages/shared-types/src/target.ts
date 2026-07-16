export interface SalesTarget {
  id: string;
  organizationId: string;
  entityType: 'User' | 'Territory' | 'Outlet';
  entityId: string;
  
  period: 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly';
  startDate: string;
  endDate: string;
  
  targetValue: number; // e.g., ₹500,000
  actualValue: number;
  
  status: 'On Track' | 'At Risk' | 'Achieved' | 'Missed';
  
  createdAt: string;
  updatedAt: string;
}
