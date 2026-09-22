import { Schema, Document } from 'mongoose';

export type DispatchDocument = Dispatch & Document;

export interface Dispatch {
  organizationId: string;
  orderId: string;
  assignedDistributorId?: string;
  dispatchedByUserId?: string;
  vehicle: string;
  driver: string;
  status: 'Pending' | 'In Transit' | 'Delivered' | 'Partial_Delivery' | 'Damaged_Delivery' | 'Short_Delivery' | 'Refused' | 'Return_Initiated' | 'Cancelled';
  deliveredItems?: { productId: string; orderedQty: number; dispatchedQty: number; deliveredQty: number; shortQty?: number; damagedQty?: number; reason?: string; evidence?: string[] }[];
  expectedDelivery?: string;
}

export const DispatchSchema = new Schema(
  {
    organizationId: { type: String, required: true, index: true },
    orderId: { type: String, required: true },
    assignedDistributorId: { type: String, index: true },
    dispatchedByUserId: { type: String },
    vehicle: { type: String, required: true },
    driver: { type: String, required: true },
    status: {
      type: String,
      required: true,
      enum: ['Pending', 'In Transit', 'Delivered', 'Partial_Delivery', 'Damaged_Delivery', 'Short_Delivery', 'Refused', 'Return_Initiated', 'Cancelled'],
      default: 'Pending',
    },
    deliveredItems: {
      type: [{
        productId: { type: String, required: true },
        orderedQty: { type: Number, required: true },
        dispatchedQty: { type: Number, required: true },
        deliveredQty: { type: Number, required: true },
        shortQty: { type: Number, required: false },
        damagedQty: { type: Number, required: false },
        reason: { type: String, required: false },
        evidence: { type: [String], required: false }
      }],
      default: [],
    },
    expectedDelivery: { type: String },
  },
  { timestamps: true, collection: 'dispatches' },
);
