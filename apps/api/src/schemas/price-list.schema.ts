import { Schema, Document } from 'mongoose';

export interface PriceList extends Document {
  organizationId: string;
  name: string;
  type: 'Customer' | 'Customer Group';
  status: 'Active' | 'Inactive';
  validFrom: string;
  validTo?: string;
  pricingRules: Record<string, any>;
}

export const PriceListSchema = new Schema(
  {
    organizationId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    type: { type: String, required: true },
    status: { type: String, required: true },
    validFrom: { type: String, required: true },
    validTo: { type: String },
    pricingRules: { type: Object, default: {} },
  },
  { timestamps: true },
);
