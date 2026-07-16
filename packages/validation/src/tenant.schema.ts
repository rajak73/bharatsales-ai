import { z } from 'zod';

export const TenantSchema = z.object({
  id: z.string(),
  name: z.string().min(2, "Name must be at least 2 characters"),
  status: z.enum(['Trial', 'Active', 'Past Due', 'Suspended', 'Archived']),
  plan: z.enum(['Starter', 'Growth', 'Enterprise']),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export type TenantPayload = z.infer<typeof TenantSchema>;
