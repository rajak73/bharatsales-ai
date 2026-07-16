import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { SalesTarget as ISalesTarget } from '@bharatsales/shared-types';

export type TargetDocument = Target & Document;

@Schema({ timestamps: true, collection: 'targets' })
export class Target implements Omit<ISalesTarget, 'id' | 'createdAt' | 'updatedAt'> {
  @Prop({ required: true, index: true }) organizationId: string;
  @Prop({ required: true, enum: ['User', 'Territory', 'Outlet'] }) entityType: 'User' | 'Territory' | 'Outlet';
  @Prop({ required: true, index: true }) entityId: string;
  
  @Prop({ required: true, enum: ['Daily', 'Weekly', 'Monthly', 'Quarterly'] }) period: 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly';
  @Prop({ required: true }) startDate: string;
  @Prop({ required: true }) endDate: string;
  
  @Prop({ required: true, min: 0 }) targetValue: number;
  @Prop({ required: true, default: 0, min: 0 }) actualValue: number;
  
  @Prop({ required: true, enum: ['On Track', 'At Risk', 'Achieved', 'Missed'], default: 'On Track' }) status: 'On Track' | 'At Risk' | 'Achieved' | 'Missed';
}

export const TargetSchema = SchemaFactory.createForClass(Target);
TargetSchema.index({ organizationId: 1, entityId: 1 });
