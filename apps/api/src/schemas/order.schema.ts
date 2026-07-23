import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Order as IOrder } from '@bharatsales/shared-types';

export type OrderDocument = Order & Document;

@Schema({ _id: false })
class OrderLineItem {
  @Prop({ required: true }) productId: string;
  @Prop({ required: true }) sku: string;
  @Prop({ required: true }) name: string;
  @Prop({ required: true, min: 1 }) quantity: number;
  @Prop({ required: true, min: 0 }) unitPrice: number;
  @Prop({ required: true, min: 0 }) discount: number;
  @Prop() appliedSchemeId?: string;
  @Prop() isFreeItem?: boolean;
  @Prop({ required: true, min: 0 }) gstPercentage: number;
  @Prop({ required: true, min: 0 }) cgstAmount: number;
  @Prop({ required: true, min: 0 }) sgstAmount: number;
  @Prop({ required: true, min: 0 }) igstAmount: number;
  @Prop({ required: true, min: 0 }) subTotal: number;
  @Prop({ required: true, min: 0 }) total: number;
  @Prop({
    type: [{
      inventoryId: { type: String, required: true },
      batch: { type: String, required: true },
      quantity: { type: Number, required: true, min: 1 }
    }],
    default: []
  })
  allocations?: { inventoryId: string; batch: string; quantity: number }[];
}

@Schema({ _id: false })
class OrderTotals {
  @Prop({ required: true, min: 0 }) subTotal: number;
  @Prop({ required: true, min: 0 }) discountTotal: number;
  @Prop({ required: true, min: 0 }) cgstTotal: number;
  @Prop({ required: true, min: 0 }) sgstTotal: number;
  @Prop({ required: true, min: 0 }) igstTotal: number;
  @Prop({ required: true, min: 0 }) grandTotal: number;
}

@Schema({ timestamps: true, collection: 'orders' })
export class Order implements Omit<IOrder, 'id' | 'createdAt' | 'updatedAt'> {
  @Prop({ required: true, index: true }) organizationId: string;
  @Prop({ required: true }) idempotencyKey: string;
  @Prop({ required: true }) orderNumber: string;
  @Prop({ required: true, index: true }) outletId: string;
  @Prop({ required: true, index: true }) createdByUserId: string;
  @Prop() assignedDistributorId?: string;
  @Prop({ required: true, enum: ['Draft', 'Submitted', 'Hold_Credit', 'Hold_Stock', 'Pending_Approval', 'Approved', 'Dispatched', 'Partial_Delivery', 'Delivered', 'Cancelled', 'Rejected'], default: 'Draft' }) status: 'Draft' | 'Submitted' | 'Hold_Credit' | 'Hold_Stock' | 'Pending_Approval' | 'Approved' | 'Dispatched' | 'Partial_Delivery' | 'Delivered' | 'Cancelled' | 'Rejected';
  @Prop({ type: [OrderLineItem], required: true }) items: OrderLineItem[];
  @Prop({ type: OrderTotals, required: true }) totals: OrderTotals;
  @Prop() notes?: string;
  @Prop({
    type: [{
      status: { type: String, required: true },
      actorId: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
      reason: { type: String }
    }],
    default: []
  })
  statusHistory?: { status: string; actorId: string; timestamp: Date; reason?: string }[];
}

export const OrderSchema = SchemaFactory.createForClass(Order);

OrderSchema.index({ organizationId: 1, orderNumber: 1 }, { unique: true });
OrderSchema.index({ organizationId: 1, idempotencyKey: 1 }, { unique: true });
