export interface TaxRate {
  id: string;
  organizationId: string;
  name: string;
  percentage: number;
  country: string;
  region?: string;
  createdAt: string;
  updatedAt: string;
}
