import { Schema, Document } from 'mongoose';

export interface IncentivePlan extends Document {
  organizationId: string;
  name: string;
  type: string; // e.g., 'Volume', 'Revenue', 'ProductSpecific'
  slab: string; // e.g., 'Level 1', 'Tier A'
  target: string;
  eligible: string;
  payout: string;
  status: string; // 'Active', 'Draft', 'Inactive'
}

export const IncentivePlanSchema = new Schema(
  {
    organizationId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    type: { type: String, required: true },
    slab: { type: String, required: true },
    target: { type: String, required: true },
    eligible: { type: String, required: true },
    payout: { type: String, required: true },
    status: { type: String, required: true, default: 'Active' },
  },
  { timestamps: true },
);

export interface IncentivePayout extends Document {
  organizationId: string;
  rep: string; // Representative Name or ID
  period: string; // e.g., 'Jul-2026'
  target: number;
  achieved: number;
  incentive: number;
  status: string; // 'Pending', 'Approved', 'Paid'
}

export const IncentivePayoutSchema = new Schema(
  {
    organizationId: { type: String, required: true, index: true },
    rep: { type: String, required: true },
    period: { type: String, required: true },
    target: { type: Number, required: true },
    achieved: { type: Number, required: true },
    incentive: { type: Number, required: true },
    status: { type: String, required: true, default: 'Pending' },
  },
  { timestamps: true },
);
