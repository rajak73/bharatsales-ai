import { Schema, Document } from 'mongoose';

export type InvoiceDocument = Invoice & Document;

export interface Invoice {
  organizationId: string;
  invoiceNumber: string;
  orderId: string;
  outletId: string;
  totalAmount: number;
  paidAmount: number;
  status: 'Unpaid' | 'Partial' | 'Paid' | 'Overdue';
  dueDate: string;
}

export const InvoiceSchema = new Schema(
  {
    organizationId: { type: String, required: true, index: true },
    invoiceNumber: { type: String, required: true, unique: true },
    orderId: { type: String, required: true, index: true },
    outletId: { type: String, required: true, index: true },

    totalAmount: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, required: true, default: 0, min: 0 },

    status: { type: String, required: true, enum: ['Unpaid', 'Partial', 'Paid', 'Overdue'], default: 'Unpaid' },
    dueDate: { type: String, required: true },
  },
  { timestamps: true, collection: 'invoices' },
);
InvoiceSchema.index({ organizationId: 1, outletId: 1, status: 1 });
