import { z } from 'zod';

// Must match the canonical 5 roles used throughout the app: the RBAC matrix
// (packages/permissions/src/index.ts), Sidebar.tsx nav filtering, and every
// role-branching check in apps/api and apps/web. A user record with any
// other role value is invisible to nav/permissions/dashboards.
export const UserRoleSchema = z.enum([
  'Super Admin',
  'Organization Admin',
  'Sales Manager',
  'Sales Representative',
  'Distributor'
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
