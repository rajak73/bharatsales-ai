import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrderSchema } from '../schemas/order.schema';
import { OutletSchema } from '../schemas/outlet.schema';
import { SchemeSchema } from '../schemas/scheme.schema';
import { DistributorSchema } from '../schemas/distributor.schema';
import { ProductSchema } from '../schemas/product.schema';
import { InventoryModule } from '../inventory/inventory.module';

import { ApprovalsModule } from '../approvals/approvals.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Order', schema: OrderSchema },
      { name: 'Outlet', schema: OutletSchema },
      { name: 'Scheme', schema: SchemeSchema },
      { name: 'Distributor', schema: DistributorSchema },
      { name: 'Product', schema: ProductSchema }
    ]),
    InventoryModule,
    ApprovalsModule
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
