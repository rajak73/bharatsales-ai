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
  createdAt: string;
  updatedAt: string;
}
