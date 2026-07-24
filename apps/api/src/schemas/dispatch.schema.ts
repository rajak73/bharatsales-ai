import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Dispatch as IDispatch } from '@bharatsales/shared-types';

export type DispatchDocument = Dispatch & Document;

@Schema({ timestamps: true, collection: 'dispatches' })
export class Dispatch implements Omit<IDispatch, 'id' | 'createdAt' | 'updatedAt'> {
  @Prop({ required: true, index: true }) organizationId: string;
  @Prop({ required: true }) orderId: string;
  @Prop({ required: true }) vehicle: string;
  @Prop({ required: true }) driver: string;
  @Prop({ required: true, enum: ['Pending', 'In Transit', 'Delivered', 'Partial_Delivery', 'Damaged_Delivery', 'Short_Delivery', 'Refused', 'Return_Initiated', 'Cancelled'], default: 'Pending' }) status: 'Pending' | 'In Transit' | 'Delivered' | 'Partial_Delivery' | 'Damaged_Delivery' | 'Short_Delivery' | 'Refused' | 'Return_Initiated' | 'Cancelled';
  @Prop({ type: [{ 
    productId: { type: String, required: true }, 
    orderedQty: { type: Number, required: true },
    dispatchedQty: { type: Number, required: true },
    deliveredQty: { type: Number, required: true },
    shortQty: { type: Number, required: false },
    damagedQty: { type: Number, required: false },
    reason: { type: String, required: false },
    evidence: { type: [String], required: false }
  }], default: [] }) deliveredItems?: { productId: string; orderedQty: number; dispatchedQty: number; deliveredQty: number; shortQty?: number; damagedQty?: number; reason?: string; evidence?: string[] }[];
  @Prop() expectedDelivery?: string;
}

export const DispatchSchema = SchemaFactory.createForClass(Dispatch);
