export interface OrderLineItem {
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
}

export interface Order {
  id: string;
  organizationId: string;
  idempotencyKey: string;
  orderNumber: string;
  outletId: string;
  createdByUserId: string; // The Sales Rep who booked it
  assignedDistributorId?: string;
  status: 'Draft' | 'Submitted' | 'Approved' | 'Dispatched' | 'Delivered' | 'Cancelled' | 'Rejected';
  items: OrderLineItem[];
  totals: {
    subTotal: number;
    discountTotal: number;
    cgstTotal: number;
    sgstTotal: number;
    igstTotal: number;
    grandTotal: number;
  };
  notes?: string;
  statusHistory?: {
    status: string;
    actorId: string;
    timestamp: Date | string;
    reason?: string;
  }[];
  createdAt: string;
  updatedAt: string;
}
