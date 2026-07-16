export type HierarchyLevel = 'Zone' | 'Region' | 'Area' | 'Territory';

export interface HierarchyNode {
  id: string;
  organizationId: string;
  name: string;
  level: HierarchyLevel;
  parentId?: string; // ID of the parent node
  managerId?: string; // ID of the User managing this node
  status: 'Active' | 'Inactive';
  createdAt: string;
  updatedAt: string;
}
