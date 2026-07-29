import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true })
export class IncentivePlan extends Document {
  @Prop({ required: true, index: true })
  organizationId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  type: string; // e.g., 'Volume', 'Revenue', 'ProductSpecific'

  @Prop({ required: true })
  slab: string; // e.g., 'Level 1', 'Tier A'

  @Prop({ required: true })
  target: string;

  @Prop({ required: true })
  eligible: string;

  @Prop({ required: true })
  payout: string;

  @Prop({ required: true, default: 'Active' })
  status: string; // 'Active', 'Draft', 'Inactive'
}

export const IncentivePlanSchema = SchemaFactory.createForClass(IncentivePlan);

@Schema({ timestamps: true })
export class IncentivePayout extends Document {
  @Prop({ required: true, index: true })
  organizationId: string;

  @Prop({ required: true })
  rep: string; // Representative Name or ID

  @Prop({ required: true })
  period: string; // e.g., 'Jul-2026'

  @Prop({ required: true, type: Number })
  target: number;

  @Prop({ required: true, type: Number })
  achieved: number;

  @Prop({ required: true, type: Number })
  incentive: number;

  @Prop({ required: true, default: 'Pending' })
  status: string; // 'Pending', 'Approved', 'Paid'
}

export const IncentivePayoutSchema = SchemaFactory.createForClass(IncentivePayout);
