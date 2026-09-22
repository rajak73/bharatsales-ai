import { Schema, Document } from 'mongoose';

export type SchemeDocument = Scheme & Document;

export interface Scheme {
  organizationId: string;
  name: string;
  description: string;
  type: 'PERCENTAGE_DISCOUNT' | 'FREE_ITEM';
  isActive: boolean;
  applicableProductIds: string[];
  minQuantity: number;
  minOrderValue: number;
  discountPercentage?: number;
  freeProductId?: string;
  freeQuantity?: number;
  validFrom: string;
  validUntil: string;
}

export const SchemeSchema = new Schema(
  {
    organizationId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    type: { type: String, required: true, enum: ['PERCENTAGE_DISCOUNT', 'FREE_ITEM'] },
    isActive: { type: Boolean, required: true, default: true },

    applicableProductIds: { type: [String], default: [] },
    minQuantity: { type: Number, required: true, min: 0 },
    minOrderValue: { type: Number, required: true, min: 0 },

    discountPercentage: { type: Number, min: 0, max: 100 },
    freeProductId: { type: String },
    freeQuantity: { type: Number, min: 1 },

    validFrom: { type: String, required: true },
    validUntil: { type: String, required: true },
  },
  { timestamps: true, collection: 'schemes' },
);
SchemeSchema.index({ organizationId: 1, isActive: 1 });
