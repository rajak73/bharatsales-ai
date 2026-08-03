export interface PriceList {
  id: string;
  organizationId: string;
  name: string;
  type: 'Customer' | 'Customer Group';
  status: 'Active' | 'Inactive';
  validFrom: string;
  validTo?: string;
  pricingRules: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}
