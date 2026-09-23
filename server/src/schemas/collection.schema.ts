import { Schema, Document } from 'mongoose';

export type CollectionDocument = PaymentCollection & Document;

export interface PaymentCollection {
  organizationId: string;
  receiptNumber: string;
  invoiceId?: string;
  outletId: string;
  collectedByUserId: string;
  amount: number;
  paymentMode: 'Cash' | 'Cheque' | 'UPI' | 'Bank Transfer';
  referenceNumber?: string;
  status: 'Pending' | 'Cleared' | 'Bounced';
  collectionDate: string;
  allocations?: { invoiceId: string, amount: number }[];
  idempotencyKey?: string;
}

export const CollectionSchema = new Schema(
  {
    organizationId: { type: String, required: true, index: true },
    receiptNumber: { type: String, required: true, unique: true },
    invoiceId: { type: String, index: true },
    outletId: { type: String, required: true, index: true },
    collectedByUserId: { type: String, required: true, index: true },

    // Negative amounts are valid: a reversal entry is recorded as a
    // negative-amount collection against the original receipt (see
    // CollectionsService.reverseCollection), not a mutation of the original.
    amount: { type: Number, required: true },
    paymentMode: { type: String, required: true, enum: ['Cash', 'Cheque', 'UPI', 'Bank Transfer'] },
    referenceNumber: { type: String },

    status: { type: String, required: true, enum: ['Pending', 'Cleared', 'Bounced'], default: 'Pending' },
    collectionDate: { type: String, required: true },

    allocations: { type: [{ invoiceId: String, amount: Number }] },
    idempotencyKey: { type: String },
  },
  { timestamps: true, collection: 'collections' },
);
CollectionSchema.index({ organizationId: 1, outletId: 1 });
// partialFilterExpression (not sparse) is required here: since organizationId is
// always present, a plain compound sparse index would still enforce uniqueness
// across every document that omits idempotencyKey (they'd collide on `null`).
CollectionSchema.index(
  { organizationId: 1, idempotencyKey: 1 },
  { unique: true, partialFilterExpression: { idempotencyKey: { $exists: true } } }
);
