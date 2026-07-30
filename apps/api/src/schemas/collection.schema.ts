import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { PaymentCollection as IPaymentCollection } from '@bharatsales/shared-types';

export type CollectionDocument = PaymentCollection & Document;

@Schema({ timestamps: true, collection: 'collections' })
export class PaymentCollection implements Omit<IPaymentCollection, 'id' | 'createdAt' | 'updatedAt'> {
  @Prop({ required: true, index: true }) organizationId: string;
  @Prop({ required: true, unique: true }) receiptNumber: string;
  @Prop({ index: true }) invoiceId?: string;
  @Prop({ required: true, index: true }) outletId: string;
  @Prop({ required: true, index: true }) collectedByUserId: string;
  
  @Prop({ required: true, min: 0 }) amount: number;
  @Prop({ required: true, enum: ['Cash', 'Cheque', 'UPI', 'Bank Transfer'] }) paymentMode: 'Cash' | 'Cheque' | 'UPI' | 'Bank Transfer';
  @Prop() referenceNumber?: string;
  
  @Prop({ required: true, enum: ['Pending', 'Cleared', 'Bounced'], default: 'Pending' }) status: 'Pending' | 'Cleared' | 'Bounced';
  @Prop({ required: true }) collectionDate: string;
  
  @Prop({ type: [{ invoiceId: String, amount: Number }] }) allocations?: { invoiceId: string, amount: number }[];
  @Prop() idempotencyKey?: string;
}

export const CollectionSchema = SchemaFactory.createForClass(PaymentCollection);
CollectionSchema.index({ organizationId: 1, outletId: 1 });
// partialFilterExpression (not sparse) is required here: since organizationId is
// always present, a plain compound sparse index would still enforce uniqueness
// across every document that omits idempotencyKey (they'd collide on `null`).
CollectionSchema.index(
  { organizationId: 1, idempotencyKey: 1 },
  { unique: true, partialFilterExpression: { idempotencyKey: { $exists: true } } }
);
