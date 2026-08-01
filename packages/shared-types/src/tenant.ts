export interface Tenant {
  id: string;
  name: string;
  status: 'Pending Approval' | 'Trial' | 'Active' | 'Past Due' | 'Suspended' | 'Archived' | 'Expired';
  plan: 'Starter' | 'Growth' | 'Enterprise';
  timezone?: string;
  currency?: string;
  billingCycle?: 'Monthly' | 'Annual';
  nextBillingDate?: string;
  subscriptionUsersLimit?: number;
  subscriptionStorageUsed?: string;
  billingHistory?: {
    id: string;
    date: string;
    plan: string;
    amount: string;
    status: string;
  }[];
  branding?: {
    logoUrl?: string;
    primaryColor?: string;
  };
  gstNumber?: string;
  address?: string;
  country?: string;
  industry?: string;
  geofenceRadius?: string;
  gpsAccuracy?: string;
  workingDays?: string[];
  shiftStart?: string;
  shiftEnd?: string;
  orderApprovalThreshold?: string;
  discountAuthority?: string;
  fiscalYearStart?: string;
  createdAt: string;
  updatedAt: string;
}
