import { Schema, Document } from 'mongoose';

export type ProductDocument = Product & Document;

interface Pricing {
  mrp: number;
  basePrice: number;
  pts: number;
  ptr: number;
  gstPercentage: number;
  tierPricing?: Record<string, number>;
}

interface Stock {
  available: number;
  uom: string;
  conversionFactor?: number;
}

const PricingSchema = new Schema(
  {
    mrp: { type: Number, required: true, min: 0 },
    basePrice: { type: Number, required: true, min: 0 },
    pts: { type: Number, required: true, min: 0 },
    ptr: { type: Number, required: true, min: 0 },
    gstPercentage: { type: Number, required: true, min: 0 },
    tierPricing: { type: Map, of: Number },
  },
  { _id: false },
);

const StockSchema = new Schema(
  {
    available: { type: Number, required: true, min: 0, default: 0 },
    uom: { type: String, required: true },
    conversionFactor: { type: Number, min: 1 },
  },
  { _id: false },
);

export interface Product {
  organizationId: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  hsn?: string;
  moq: number;
  status: 'Active' | 'Inactive';
  pricing: Pricing;
  stock: Stock;
  taxHistory?: { rate: number, effectiveFrom: string }[];
}

export const ProductSchema = new Schema(
  {
    organizationId: { type: String, required: true, index: true },
    sku: { type: String, required: true },
    name: { type: String, required: true },
    brand: { type: String, required: true },
    category: { type: String, required: true },
    hsn: { type: String },
    moq: { type: Number, default: 1, min: 1 },
    status: { type: String, required: true, enum: ['Active', 'Inactive'], default: 'Active' },
    pricing: { type: PricingSchema, required: true },
    stock: { type: StockSchema, required: true },
    taxHistory: { type: [{ rate: Number, effectiveFrom: String }] },
  },
  { timestamps: true, collection: 'products' },
);

ProductSchema.index({ organizationId: 1, sku: 1 }, { unique: true });
