import { Schema, Document } from 'mongoose';

export type InventoryDocument = Inventory & Document;

export interface Inventory {
  organizationId: string;
  warehouseId?: string;
  distributorId?: string;
  productId: string;
  productName: string;
  sku: string;
  batch: string;
  stock: number;
  reservedStock: number;
  expiry?: string;
  status?: string;
  blocked?: boolean;
}

export const InventorySchema = new Schema(
  {
    organizationId: { type: String, required: true, index: true },
    warehouseId: { type: String },
    distributorId: { type: String },
    productId: { type: String, required: true },
    productName: { type: String, required: true },
    sku: { type: String, required: true },
    batch: { type: String, required: true },
    stock: { type: Number, required: true, default: 0 },
    reservedStock: { type: Number, default: 0 },
    expiry: { type: String },
    status: { type: String, default: 'Active' },
    blocked: { type: Boolean, default: false },
  },
  { timestamps: true, collection: 'inventory' },
);

InventorySchema.index({ expiry: 1 });
// Perf: FEFO batch allocation per product within an org.
InventorySchema.index({ organizationId: 1, productId: 1, expiry: 1 });
