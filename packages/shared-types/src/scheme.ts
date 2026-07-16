export interface Scheme {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  type: 'PERCENTAGE_DISCOUNT' | 'FREE_ITEM';
  isActive: boolean;
  
  // Criteria
  applicableProductIds: string[]; // empty means all products
  minQuantity: number;
  minOrderValue: number;

  // Benefits
  discountPercentage?: number;
  freeProductId?: string;
  freeQuantity?: number;

  validFrom: string;
  validUntil: string;
  createdAt: string;
  updatedAt: string;
}
