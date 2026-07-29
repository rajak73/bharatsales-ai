import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { InventoryCleanupService } from './inventory.cleanup.service';
import { Inventory, InventorySchema } from '../schemas/inventory.schema';
import { Order, OrderSchema } from '../schemas/order.schema';
import { Product, ProductSchema } from '../schemas/product.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Inventory.name, schema: InventorySchema },
      { name: 'Product', schema: ProductSchema },
      { name: Order.name, schema: OrderSchema }
    ]),
  ],
  controllers: [InventoryController],
  providers: [InventoryService, InventoryCleanupService],
  exports: [InventoryService],
})
export class InventoryModule {}
