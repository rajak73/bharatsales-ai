import { Module } from '@nestjs/common';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
import { MongooseModule } from '@nestjs/mongoose';
import { OrderSchema, VisitSchema, ProductSchema, PriceListSchema, OutletSchema } from '../schemas';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Order', schema: OrderSchema },
      { name: 'Visit', schema: VisitSchema },
      { name: 'Product', schema: ProductSchema },
      { name: 'PriceList', schema: PriceListSchema },
      { name: 'Outlet', schema: OutletSchema }
    ]),
    OrdersModule
  ],
  controllers: [SyncController],
  providers: [SyncService]
})
export class SyncModule {}
