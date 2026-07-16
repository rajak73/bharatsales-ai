export interface Tenant {
  id: string;
  name: string;
  status: 'Trial' | 'Active' | 'Past Due' | 'Suspended' | 'Archived';
  plan: 'Starter' | 'Growth' | 'Enterprise';
  timezone?: string;
  currency?: string;
  branding?: {
    logoUrl?: string;
    primaryColor?: string;
  };
  createdAt: string;
  updatedAt: string;
}
