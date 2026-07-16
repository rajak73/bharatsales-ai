import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Inventory as IInventory } from '@bharatsales/shared-types';

export type InventoryDocument = Inventory & Document;

@Schema({ timestamps: true, collection: 'inventory' })
export class Inventory implements Omit<IInventory, 'id' | 'createdAt' | 'updatedAt'> {
  @Prop({ required: true, index: true }) organizationId: string;
  @Prop() warehouseId?: string;
  @Prop() distributorId?: string;
  @Prop({ required: true }) productId: string;
  @Prop({ required: true }) productName: string;
  @Prop({ required: true }) sku: string;
  @Prop({ required: true }) batch: string;
  @Prop({ required: true, default: 0 }) stock: number;
  @Prop({ default: 0 }) reservedStock: number;
  @Prop() expiry?: string;
}

export const InventorySchema = SchemaFactory.createForClass(Inventory);
