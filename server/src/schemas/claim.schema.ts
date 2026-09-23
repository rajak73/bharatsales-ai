import { Schema, Document } from 'mongoose';
import { ClaimStatus } from '@bharatsales/shared-types';

export interface Claim extends Document {
  organizationId: string;
  distributorId?: string;
  outletId?: string;
  claimNumber: string;
  type: string;
  amount: number;
  status: ClaimStatus;
  reason?: string;
  referenceDocumentType?: string;
  referenceDocumentId?: string;
  attachments?: string[];
  submittedByUserId: string;
  approvedByUserId?: string;
  approvedAt?: Date;
}

export const ClaimSchema = new Schema(
  {
    organizationId: { type: String, required: true, index: true },
    distributorId: { type: Schema.Types.ObjectId, ref: 'Distributor' },
    outletId: { type: Schema.Types.ObjectId, ref: 'Outlet' },
    claimNumber: { type: String, required: true, unique: true },
    type: { type: String, required: true, enum: ['Scheme', 'Damage', 'Expiry', 'Price Difference', 'Other'] },
    amount: { type: Number, required: true },
    status: { type: String, required: true, default: 'Pending' },
    reason: { type: String },
    referenceDocumentType: { type: String, enum: ['Order', 'Return', 'Invoice'] },
    referenceDocumentId: { type: String },
    attachments: { type: [String] },
    submittedByUserId: { type: String, required: true },
    approvedByUserId: { type: String },
    approvedAt: { type: Date },
  },
  { timestamps: true },
);
ClaimSchema.index({ organizationId: 1, status: 1 });
ClaimSchema.index({ organizationId: 1, claimNumber: 1 }, { unique: true });
