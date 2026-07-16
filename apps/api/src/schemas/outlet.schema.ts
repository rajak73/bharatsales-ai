import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Outlet as IOutlet } from '@bharatsales/shared-types';

export type OutletDocument = Outlet & Document;

@Schema({ _id: false })
class Location {
  @Prop({ required: true }) address: string;
  @Prop({ required: true }) state: string;
  @Prop({ required: true }) pinCode: string;
  @Prop({ required: true }) latitude: number;
  @Prop({ required: true }) longitude: number;
  @Prop({ default: 5 }) geofenceRadiusMeters: number;
}

@Schema({ _id: false })
class Commercial {
  @Prop() priceListId?: string;
  @Prop({ required: true, min: 0 }) creditLimit: number;
  @Prop({ required: true, min: 0 }) paymentTermsDays: number;
  @Prop({ required: true, default: 0 }) outstandingBalance: number;
  @Prop() assignedDistributorId?: string;
}

@Schema({ _id: false })
class Tax {
  @Prop() gstin?: string;
  @Prop() pan?: string;
}

@Schema({ timestamps: true, collection: 'outlets' })
export class Outlet implements Omit<IOutlet, 'id' | 'createdAt' | 'updatedAt'> {
  @Prop({ required: true, index: true }) organizationId: string;
  @Prop({ required: true }) code: string;
  @Prop({ required: true }) name: string;
  @Prop({ required: true }) ownerName: string;
  @Prop({ required: true }) category: string;
  @Prop({ required: true, enum: ['A', 'B', 'C', 'D'] }) tier: 'A' | 'B' | 'C' | 'D';
  @Prop({ required: true, enum: ['Active', 'Inactive', 'Pending Approval'], default: 'Active' }) status: 'Active' | 'Inactive' | 'Pending Approval';
  @Prop({ required: true }) mobile: string;
  @Prop({ type: Location, required: true }) location: Location;
  @Prop({ type: Commercial, required: true }) commercial: Commercial;
  @Prop({ type: Tax, required: true }) tax: Tax;
}

export const OutletSchema = SchemaFactory.createForClass(Outlet);

// Compound index for uniqueness across organization
OutletSchema.index({ organizationId: 1, code: 1 }, { unique: true });
