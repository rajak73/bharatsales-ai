export interface Inventory {
  id: string;
  organizationId: string;
  warehouseId?: string;
  distributorId?: string;
  productId: string;
  productName: string;
  sku: string;
  batch: string;
  stock: number;
  reservedStock?: number;
  expiry?: string;
  status?: string; // 'Active', 'Expired', 'Quarantine', etc.
  blocked?: boolean;
  createdAt: string;
  updatedAt: string;
}
