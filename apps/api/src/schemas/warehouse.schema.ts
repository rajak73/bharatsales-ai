import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Warehouse as IWarehouse } from '@bharatsales/shared-types';

export type WarehouseDocument = Warehouse & Document;

@Schema({ timestamps: true, collection: 'warehouses' })
export class Warehouse implements Omit<IWarehouse, 'id' | 'createdAt' | 'updatedAt'> {
  @Prop({ required: true, index: true }) organizationId: string;
  @Prop({ required: true }) name: string;
  @Prop({ required: true }) location: string;
  @Prop({ required: true }) capacity: string;
  @Prop({ required: true, enum: ['Active', 'Inactive', 'Maintenance'], default: 'Active' }) status: 'Active' | 'Inactive' | 'Maintenance';
}

export const WarehouseSchema = SchemaFactory.createForClass(Warehouse);
