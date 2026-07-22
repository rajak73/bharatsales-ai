import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Tenant as ITenant } from '@bharatsales/shared-types';

export type TenantDocument = Tenant & Document;

@Schema({ _id: false })
class Branding {
  @Prop()
  logoUrl?: string;

  @Prop()
  primaryColor?: string;
}

@Schema({ _id: false })
class BillingHistory {
  @Prop({ required: true })
  id: string;
  @Prop({ required: true })
  date: string;
  @Prop({ required: true })
  plan: string;
  @Prop({ required: true })
  amount: string;
  @Prop({ required: true })
  status: string;
}

@Schema({ timestamps: true, collection: 'tenants' })
export class Tenant implements Omit<ITenant, 'id' | 'createdAt' | 'updatedAt'> {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: ['Trial', 'Active', 'Past Due', 'Suspended', 'Archived'], default: 'Trial' })
  status: 'Trial' | 'Active' | 'Past Due' | 'Suspended' | 'Archived';

  @Prop({ required: true, enum: ['Starter', 'Growth', 'Enterprise'], default: 'Starter' })
  plan: 'Starter' | 'Growth' | 'Enterprise';

  @Prop()
  timezone?: string;

  @Prop()
  currency?: string;

  @Prop({ enum: ['Monthly', 'Annual'], default: 'Annual' })
  billingCycle?: 'Monthly' | 'Annual';

  @Prop()
  nextBillingDate?: string;

  @Prop({ default: 10 })
  subscriptionUsersLimit?: number;

  @Prop({ default: '5GB' })
  subscriptionStorageUsed?: string;

  @Prop({ type: [BillingHistory], default: [] })
  billingHistory?: BillingHistory[];

  @Prop({ type: Branding })
  branding?: Branding;
}

export const TenantSchema = SchemaFactory.createForClass(Tenant);
