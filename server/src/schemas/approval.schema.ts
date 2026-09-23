import { Schema, Document } from 'mongoose';

export interface Approval extends Document {
  organizationId: string;
  outlet: string;
  order: string;
  type: string;
  reason: string;
  amount: number;
  priority: 'High' | 'Medium' | 'Low';
  requestedBy: string;
  date: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

export const ApprovalSchema = new Schema(
  {
    organizationId: { type: String, required: true, index: true },
    outlet: { type: String, required: true },
    order: { type: String, required: true },
    type: { type: String, required: true },
    reason: { type: String, required: true },
    amount: { type: Number, required: true },
    priority: { type: String, required: true },
    requestedBy: { type: String, required: true },
    date: { type: String, required: true },
    status: { type: String, required: true, default: 'Pending' },
  },
  { timestamps: true },
);
