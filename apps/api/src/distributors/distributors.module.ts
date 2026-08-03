import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DistributorsController } from './distributors.controller';
import { DistributorsService } from './distributors.service';
import { Distributor, DistributorSchema } from '../schemas/distributor.schema';
import { Order, OrderSchema } from '../schemas/order.schema';
import { Inventory, InventorySchema } from '../schemas/inventory.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Distributor.name, schema: DistributorSchema },
      { name: Order.name, schema: OrderSchema },
      { name: Inventory.name, schema: InventorySchema },
    ]),
  ],
  controllers: [DistributorsController],
  providers: [DistributorsService],
  exports: [DistributorsService],
})
export class DistributorsModule {}
