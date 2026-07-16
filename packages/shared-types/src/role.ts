export interface Role {
  id: string;
  organizationId: string;
  name: string;
  users: number; // Derived/Display field
  permissions: string;
  scope: string;
  createdAt: string;
  updatedAt: string;
}
