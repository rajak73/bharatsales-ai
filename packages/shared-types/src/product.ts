export interface Product {
  id: string;
  organizationId: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  status: 'Active' | 'Inactive';
  hsn?: string;
  pricing: {
    mrp: number;
    basePrice: number; // Stored in smallest currency unit (e.g., paise)
    pts: number;
    ptr: number;
    gstPercentage: number;
  };
  stock: {
    available: number;
    uom: string; // Unit of Measure (e.g., Piece, Box, Kg)
    conversionFactor?: number;
  };
  taxHistory?: {
    rate: number;
    effectiveFrom: string; // ISO date string
  }[];
  createdAt: string;
  updatedAt: string;
}
