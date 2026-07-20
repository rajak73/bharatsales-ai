import { Module } from '@nestjs/common';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
import { MongooseModule } from '@nestjs/mongoose';
import { OrderSchema, VisitSchema, CollectionSchema, ProductSchema, PriceListSchema, OutletSchema } from '../schemas';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Order', schema: OrderSchema },
      { name: 'Visit', schema: VisitSchema },
      { name: 'Collection', schema: CollectionSchema },
      { name: 'Product', schema: ProductSchema },
      { name: 'PriceList', schema: PriceListSchema },
      { name: 'Outlet', schema: OutletSchema }
    ])
  ],
  controllers: [SyncController],
  providers: [SyncService]
})
export class SyncModule {}
