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
  @Prop({ required: true, enum: ['Draft', 'Submitted', 'Pending_Approval', 'Approved', 'Received', 'Inspected', 'Closed', 'Rejected', 'Cancelled'], default: 'Draft' }) status: 'Draft' | 'Submitted' | 'Pending_Approval' | 'Approved' | 'Received' | 'Inspected' | 'Closed' | 'Rejected' | 'Cancelled';
  @Prop({ type: [{ product: { type: String, required: true }, qty: { type: Number, required: true } }], default: [] }) items?: { product: string; qty: number }[];
  @Prop() managerApprovedBy?: string;
  @Prop() financeApprovedBy?: string;
}

export const ReturnSchema = SchemaFactory.createForClass(ReturnOrder);
