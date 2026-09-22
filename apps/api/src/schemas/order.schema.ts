import { Schema, Document } from 'mongoose';

export type OrderDocument = Order & Document;

interface OrderLineItem {
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  appliedSchemeId?: string;
  isFreeItem?: boolean;
  gstPercentage: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  subTotal: number;
  total: number;
  allocations?: { inventoryId: string; batch: string; quantity: number }[];
}

interface OrderTotals {
  subTotal: number;
  discountTotal: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  grandTotal: number;
}

const OrderLineItemSchema = new Schema(
  {
    productId: { type: String, required: true },
    sku: { type: String, required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    discount: { type: Number, required: true, min: 0 },
    appliedSchemeId: { type: String },
    isFreeItem: { type: Boolean },
    gstPercentage: { type: Number, required: true, min: 0 },
    cgstAmount: { type: Number, required: true, min: 0 },
    sgstAmount: { type: Number, required: true, min: 0 },
    igstAmount: { type: Number, required: true, min: 0 },
    subTotal: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    allocations: {
      type: [{
        inventoryId: { type: String, required: true },
        batch: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 }
      }],
      default: []
    },
  },
  { _id: false },
);

const OrderTotalsSchema = new Schema(
  {
    subTotal: { type: Number, required: true, min: 0 },
    discountTotal: { type: Number, required: true, min: 0 },
    cgstTotal: { type: Number, required: true, min: 0 },
    sgstTotal: { type: Number, required: true, min: 0 },
    igstTotal: { type: Number, required: true, min: 0 },
    grandTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

export interface Order {
  organizationId: string;
  idempotencyKey: string;
  orderNumber: string;
  outletId: string;
  createdByUserId: string;
  assignedDistributorId?: string;
  status: 'Draft' | 'Submitted' | 'Hold_Credit' | 'Hold_Stock' | 'Pending_Approval' | 'Approved' | 'Dispatched' | 'Partial_Delivery' | 'Delivered' | 'Cancelled' | 'Rejected';
  items: OrderLineItem[];
  totals: OrderTotals;
  notes?: string;
  statusHistory?: { status: string; actorId: string; timestamp: Date; reason?: string }[];
}

export const OrderSchema = new Schema(
  {
    organizationId: { type: String, required: true, index: true },
    idempotencyKey: { type: String, required: true },
    orderNumber: { type: String, required: true },
    outletId: { type: String, required: true, index: true },
    createdByUserId: { type: String, required: true, index: true },
    assignedDistributorId: { type: String },
    status: {
      type: String,
      required: true,
      enum: ['Draft', 'Submitted', 'Hold_Credit', 'Hold_Stock', 'Pending_Approval', 'Approved', 'Dispatched', 'Partial_Delivery', 'Delivered', 'Cancelled', 'Rejected'],
      default: 'Draft',
    },
    items: { type: [OrderLineItemSchema], required: true },
    totals: { type: OrderTotalsSchema, required: true },
    notes: { type: String },
    statusHistory: {
      type: [{
        status: { type: String, required: true },
        actorId: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        reason: { type: String }
      }],
      default: []
    },
  },
  { timestamps: true, collection: 'orders' },
);

OrderSchema.index({ organizationId: 1, orderNumber: 1 }, { unique: true });
OrderSchema.index({ organizationId: 1, idempotencyKey: 1 }, { unique: true });
// Perf: org-scoped order lists sorted newest first.
OrderSchema.index({ organizationId: 1, createdAt: -1 });
