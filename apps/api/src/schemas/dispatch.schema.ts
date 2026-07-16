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
  @Prop({ required: true, enum: ['Pending', 'In Transit', 'Delivered', 'Cancelled'], default: 'Pending' }) status: 'Pending' | 'In Transit' | 'Delivered' | 'Cancelled';
  @Prop() expectedDelivery?: string;
}

export const DispatchSchema = SchemaFactory.createForClass(Dispatch);
