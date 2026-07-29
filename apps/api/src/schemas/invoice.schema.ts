import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Invoice as IInvoice } from '@bharatsales/shared-types';

export type InvoiceDocument = Invoice & Document;

@Schema({ timestamps: true, collection: 'invoices' })
export class Invoice implements Omit<IInvoice, 'id' | 'createdAt' | 'updatedAt'> {
  @Prop({ required: true, index: true }) organizationId: string;
  @Prop({ required: true, unique: true }) invoiceNumber: string;
  @Prop({ required: true, index: true }) orderId: string;
  @Prop({ required: true, index: true }) outletId: string;
  
  @Prop({ required: true, min: 0 }) totalAmount: number;
  @Prop({ required: true, default: 0, min: 0 }) paidAmount: number;
  
  @Prop({ required: true, enum: ['Unpaid', 'Partial', 'Paid', 'Overdue'], default: 'Unpaid' }) status: 'Unpaid' | 'Partial' | 'Paid' | 'Overdue';
  @Prop({ required: true }) dueDate: string;
}

export const InvoiceSchema = SchemaFactory.createForClass(Invoice);
InvoiceSchema.index({ organizationId: 1, outletId: 1, status: 1 });
