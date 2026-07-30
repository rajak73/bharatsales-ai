import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CollectionsController } from './collections.controller';
import { CollectionsService } from './collections.service';
import { CollectionSchema } from '../schemas/collection.schema';
import { OutletSchema } from '../schemas/outlet.schema';

import { InvoiceSchema } from '../schemas/invoice.schema';
import { OrderSchema } from '../schemas/order.schema';
import { HierarchyModule } from '../hierarchy/hierarchy.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Collection', schema: CollectionSchema },
      { name: 'Outlet', schema: OutletSchema },
      { name: 'Invoice', schema: InvoiceSchema },
      { name: 'Order', schema: OrderSchema }
    ]),
    HierarchyModule,
  ],
  controllers: [CollectionsController],
  providers: [CollectionsService],
})
export class CollectionsModule {}
