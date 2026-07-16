import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ReturnOrder as IReturnOrder } from '@bharatsales/shared-types';

export type ReturnDocument = ReturnOrder & Document;

@Schema({ timestamps: true, collection: 'returns' })
export class ReturnOrder implements Omit<IReturnOrder, 'id' | 'createdAt' | 'updatedAt'> {
  @Prop({ required: true, index: true }) organizationId: string;
  @Prop({ required: true }) orderId: string;
  @Prop({ required: true }) outlet: string;
  @Prop({ required: true }) reason: string;
  @Prop({ required: true }) value: string;
  @Prop({ required: true, enum: ['Pending Approval', 'Approved', 'Rejected', 'Processed'], default: 'Pending Approval' }) status: 'Pending Approval' | 'Approved' | 'Rejected' | 'Processed';
}

export const ReturnSchema = SchemaFactory.createForClass(ReturnOrder);
