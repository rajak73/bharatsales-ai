import { Schema, Document } from 'mongoose';

export interface Expense extends Document {
  organizationId: string;
  userId: string;
  type: string;
  amount: number;
  date: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  notes?: string;
  attachments: string[];
}

export const ExpenseSchema = new Schema(
  {
    organizationId: { type: String, required: true, index: true },
    userId: { type: String, required: true },
    type: { type: String, required: true },
    amount: { type: Number, required: true },
    date: { type: String, required: true },
    status: { type: String, required: true },
    notes: { type: String },
    attachments: { type: [String], default: [] },
  },
  { timestamps: true },
);
