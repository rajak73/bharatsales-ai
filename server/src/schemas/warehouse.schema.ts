import { Schema, Document } from 'mongoose';

export type WarehouseDocument = Warehouse & Document;

export interface Warehouse {
  organizationId: string;
  name: string;
  location: string;
  capacity: string;
  status: 'Active' | 'Inactive' | 'Maintenance';
}

export const WarehouseSchema = new Schema(
  {
    organizationId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    location: { type: String, required: true },
    capacity: { type: String, required: true },
    status: { type: String, required: true, enum: ['Active', 'Inactive', 'Maintenance'], default: 'Active' },
  },
  { timestamps: true, collection: 'warehouses' },
);
