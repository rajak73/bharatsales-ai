import { z } from 'zod';

export const UserRoleSchema = z.enum([
  'Super Admin',
  'Company Admin',
  'National Sales Manager',
  'Zonal Sales Manager',
  'Regional Sales Manager',
  'Area Sales Manager',
  'Sales Representative',
  'Distributor Owner',
  'Distributor Staff',
  'Finance User',
  'Auditor'
]);

export const UserSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  email: z.string().email(),
  name: z.string().min(2),
  role: UserRoleSchema,
  mobile: z.string().optional(),
  status: z.enum(['Active', 'Inactive', 'Suspended']),
  territoryIds: z.array(z.string()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export type UserPayload = z.infer<typeof UserSchema>;
