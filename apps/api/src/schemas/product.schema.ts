import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Product as IProduct } from '@bharatsales/shared-types';

export type ProductDocument = Product & Document;

@Schema({ _id: false })
class Pricing {
  @Prop({ required: true, min: 0 }) mrp: number;
  @Prop({ required: true, min: 0 }) basePrice: number;
  @Prop({ required: true, min: 0 }) pts: number;
  @Prop({ required: true, min: 0 }) ptr: number;
  @Prop({ required: true, min: 0 }) gstPercentage: number;
}

@Schema({ _id: false })
class Stock {
  @Prop({ required: true, min: 0, default: 0 }) available: number;
  @Prop({ required: true }) uom: string;
  @Prop({ min: 1 }) conversionFactor?: number;
}

@Schema({ timestamps: true, collection: 'products' })
export class Product implements Omit<IProduct, 'id' | 'createdAt' | 'updatedAt'> {
  @Prop({ required: true, index: true }) organizationId: string;
  @Prop({ required: true }) sku: string;
  @Prop({ required: true }) name: string;
  @Prop({ required: true }) brand: string;
  @Prop({ required: true }) category: string;
  @Prop() hsn?: string;
  @Prop({ required: true, enum: ['Active', 'Inactive'], default: 'Active' }) status: 'Active' | 'Inactive';
  @Prop({ type: Pricing, required: true }) pricing: Pricing;
  @Prop({ type: Stock, required: true }) stock: Stock;
  @Prop({ type: [{ rate: Number, effectiveFrom: String }] }) taxHistory?: { rate: number, effectiveFrom: string }[];
}

export const ProductSchema = SchemaFactory.createForClass(Product);

ProductSchema.index({ organizationId: 1, sku: 1 }, { unique: true });
