import { z } from 'zod';

export const OrderLineItemSchema = z.object({
  productId: z.string(),
  sku: z.string(),
  name: z.string(),
  quantity: z.number().int().min(1),
  unitPrice: z.number().min(0),
  discount: z.number().min(0),
  gstPercentage: z.number().min(0),
  gstAmount: z.number().min(0),
  subTotal: z.number().min(0),
  total: z.number().min(0)
});

export const OrderSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  orderNumber: z.string(),
  outletId: z.string(),
  createdByUserId: z.string(),
  assignedDistributorId: z.string().optional(),
  status: z.enum(['Draft', 'Submitted', 'Approved', 'Dispatched', 'Delivered', 'Cancelled', 'Rejected']),
  items: z.array(OrderLineItemSchema).min(1, "Order must have at least one item"),
  totals: z.object({
    subTotal: z.number().min(0),
    discountTotal: z.number().min(0),
    gstTotal: z.number().min(0),
    grandTotal: z.number().min(0)
  }),
  notes: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export type OrderPayload = z.infer<typeof OrderSchema>;
