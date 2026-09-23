import { Schema, Document } from 'mongoose';

export interface TaxRate extends Document {
  organizationId: string;
  name: string;
  percentage: number;
  country: string;
  region?: string;
}

export const TaxRateSchema = new Schema(
  {
    organizationId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    percentage: { type: Number, required: true },
    country: { type: String, required: true },
    region: { type: String },
  },
  { timestamps: true },
);
