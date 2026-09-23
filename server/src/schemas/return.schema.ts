import { Schema, Document } from 'mongoose';

export type ReturnDocument = ReturnOrder & Document;

export interface ReturnOrder {
  organizationId: string;
  orderId: string;
  outlet: string;
  reason: string;
  value: string;
  status: 'Draft' | 'Submitted' | 'Pending_Approval' | 'Approved' | 'Received' | 'Inspected' | 'Closed' | 'Rejected' | 'Cancelled';
  items?: { product: string; qty: number }[];
  managerApprovedBy?: string;
  financeApprovedBy?: string;
}

export const ReturnSchema = new Schema(
  {
    organizationId: { type: String, required: true, index: true },
    orderId: { type: String, required: true },
    outlet: { type: String, required: true },
    reason: { type: String, required: true },
    value: { type: String, required: true },
    status: {
      type: String,
      required: true,
      enum: ['Draft', 'Submitted', 'Pending_Approval', 'Approved', 'Received', 'Inspected', 'Closed', 'Rejected', 'Cancelled'],
      default: 'Draft',
    },
    items: { type: [{ product: { type: String, required: true }, qty: { type: Number, required: true } }], default: [] },
    managerApprovedBy: { type: String },
    financeApprovedBy: { type: String },
  },
  { timestamps: true, collection: 'returns' },
);
