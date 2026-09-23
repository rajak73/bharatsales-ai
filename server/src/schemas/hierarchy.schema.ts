import { Schema, Document, SchemaTypes } from 'mongoose';
import { HierarchyLevel } from '@bharatsales/shared-types';

export type HierarchyNodeDocument = HierarchyNode & Document;

export interface HierarchyNode {
  organizationId: string;
  name: string;
  level: HierarchyLevel;
  parentId?: string;
  managerId?: string;
  status: 'Active' | 'Inactive';
}

export const HierarchyNodeSchema = new Schema(
  {
    organizationId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    level: { type: String, required: true, enum: ['Zone', 'Region', 'Area', 'Territory'] },
    parentId: { type: SchemaTypes.ObjectId, ref: 'HierarchyNode' },
    managerId: { type: SchemaTypes.ObjectId, ref: 'User' },
    status: { type: String, required: true, enum: ['Active', 'Inactive'], default: 'Active' },
  },
  { timestamps: true, collection: 'hierarchy_nodes' },
);
