import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes } from 'mongoose';
import { HierarchyNode as IHierarchyNode, HierarchyLevel } from '@bharatsales/shared-types';

export type HierarchyNodeDocument = HierarchyNode & Document;

@Schema({ timestamps: true, collection: 'hierarchy_nodes' })
export class HierarchyNode implements Omit<IHierarchyNode, 'id' | 'createdAt' | 'updatedAt'> {
  @Prop({ required: true, index: true })
  organizationId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: ['Zone', 'Region', 'Area', 'Territory'] })
  level: HierarchyLevel;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'HierarchyNode' })
  parentId?: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User' })
  managerId?: string;

  @Prop({ required: true, enum: ['Active', 'Inactive'], default: 'Active' })
  status: 'Active' | 'Inactive';
}

export const HierarchyNodeSchema = SchemaFactory.createForClass(HierarchyNode);
