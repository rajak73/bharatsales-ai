import { z } from 'zod';

export const OutletSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  code: z.string(),
  name: z.string().min(2),
  ownerName: z.string(),
  category: z.string(),
  tier: z.enum(['A', 'B', 'C', 'D']),
  status: z.enum(['Active', 'Inactive', 'Pending Approval']),
  mobile: z.string(),
  location: z.object({
    address: z.string(),
    state: z.string(),
    pinCode: z.string(),
    latitude: z.number(),
    longitude: z.number(),
    geofenceRadiusMeters: z.number().default(5)
  }),
  commercial: z.object({
    priceListId: z.string().optional(),
    creditLimit: z.number().min(0),
    paymentTermsDays: z.number().min(0),
    outstandingBalance: z.number(),
    assignedDistributorId: z.string().optional()
  }),
  tax: z.object({
    gstin: z.string().optional(),
    pan: z.string().optional()
  }),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export type OutletPayload = z.infer<typeof OutletSchema>;
