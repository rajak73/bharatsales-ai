import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Scheme as IScheme } from '@bharatsales/shared-types';

export type SchemeDocument = Scheme & Document;

@Schema({ timestamps: true, collection: 'schemes' })
export class Scheme implements Omit<IScheme, 'id' | 'createdAt' | 'updatedAt'> {
  @Prop({ required: true, index: true }) organizationId: string;
  @Prop({ required: true }) name: string;
  @Prop({ required: true }) description: string;
  @Prop({ required: true, enum: ['PERCENTAGE_DISCOUNT', 'FREE_ITEM'] }) type: 'PERCENTAGE_DISCOUNT' | 'FREE_ITEM';
  @Prop({ required: true, default: true }) isActive: boolean;
  
  @Prop({ type: [String], default: [] }) applicableProductIds: string[];
  @Prop({ required: true, min: 0 }) minQuantity: number;
  @Prop({ required: true, min: 0 }) minOrderValue: number;

  @Prop({ min: 0, max: 100 }) discountPercentage?: number;
  @Prop() freeProductId?: string;
  @Prop({ min: 1 }) freeQuantity?: number;

  @Prop({ required: true }) validFrom: string;
  @Prop({ required: true }) validUntil: string;
}

export const SchemeSchema = SchemaFactory.createForClass(Scheme);
SchemeSchema.index({ organizationId: 1, isActive: 1 });
