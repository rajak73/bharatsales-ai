import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CollectionsController } from './collections.controller';
import { CollectionsService } from './collections.service';
import { CollectionSchema } from '../schemas/collection.schema';
import { OutletSchema } from '../schemas/outlet.schema';

import { InvoiceSchema } from '../schemas/invoice.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Collection', schema: CollectionSchema },
      { name: 'Outlet', schema: OutletSchema },
      { name: 'Invoice', schema: InvoiceSchema }
    ])
  ],
  controllers: [CollectionsController],
  providers: [CollectionsService],
})
export class CollectionsModule {}
