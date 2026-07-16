import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Distributor as IDistributor } from '@bharatsales/shared-types';

export type DistributorDocument = Distributor & Document;

@Schema({ _id: false })
class Location {
  @Prop({ required: true }) address: string;
  @Prop({ required: true }) city: string;
  @Prop({ required: true }) state: string;
  @Prop({ required: true }) pinCode: string;
  @Prop({ required: true }) latitude: number;
  @Prop({ required: true }) longitude: number;
}

@Schema({ _id: false })
class TaxInfo {
  @Prop() gstin?: string;
  @Prop() pan?: string;
}

@Schema({ timestamps: true, collection: 'distributors' })
export class Distributor implements Omit<IDistributor, 'id' | 'createdAt' | 'updatedAt'> {
  @Prop({ required: true, index: true }) organizationId: string;
  @Prop({ required: true }) name: string;
  @Prop({ required: true }) code: string;
  @Prop({ required: true }) ownerName: string;
  @Prop({ required: true }) mobile: string;
  @Prop({ required: true, enum: ['Active', 'Inactive'] }) status: 'Active' | 'Inactive';
  
  @Prop({ type: Location, required: true }) location: Location;
  @Prop({ type: TaxInfo, required: true }) tax: TaxInfo;
}

export const DistributorSchema = SchemaFactory.createForClass(Distributor);
DistributorSchema.index({ organizationId: 1, code: 1 }, { unique: true });
