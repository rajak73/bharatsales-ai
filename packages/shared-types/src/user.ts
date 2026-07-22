export type UserRole = 
  | 'Super Admin' 
  | 'Company Admin' 
  | 'National Sales Manager' 
  | 'Zonal Sales Manager' 
  | 'Regional Sales Manager' 
  | 'Area Sales Manager' 
  | 'Sales Representative' 
  | 'Distributor Owner' 
  | 'Distributor Staff' 
  | 'Finance User' 
  | 'Auditor';

export interface User {
  id: string;
  organizationId: string;
  email: string;
  name: string;
  role: UserRole;
  mobile?: string;
  status: 'Active' | 'Inactive' | 'Suspended' | 'Invited';
  territoryIds?: string[]; // IDs of assigned territories
  createdAt: string;
  updatedAt: string;
}
