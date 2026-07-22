export interface Tenant {
  id: string;
  name: string;
  status: 'Trial' | 'Active' | 'Past Due' | 'Suspended' | 'Archived';
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
  createdAt: string;
  updatedAt: string;
}
