import { z } from 'zod';

export const ProductSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  sku: z.string(),
  name: z.string().min(2),
  brand: z.string(),
  category: z.string(),
  status: z.enum(['Active', 'Inactive']),
  pricing: z.object({
    mrp: z.number().min(0),
    basePrice: z.number().min(0),
    gstPercentage: z.number().min(0)
  }),
  stock: z.object({
    available: z.number().min(0),
    uom: z.string()
  }),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export type ProductPayload = z.infer<typeof ProductSchema>;
