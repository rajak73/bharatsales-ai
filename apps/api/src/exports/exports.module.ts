import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ExportsController } from './exports.controller';
import { ExportsService } from './exports.service';
import { ExportJobSchema } from '../schemas/export-job.schema';
import { OrderSchema } from '../schemas/order.schema';
import { ReturnSchema } from '../schemas/return.schema';
import { InvoiceSchema } from '../schemas/invoice.schema';
import { CollectionSchema } from '../schemas/collection.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'ExportJob', schema: ExportJobSchema },
      { name: 'Order', schema: OrderSchema },
      { name: 'ReturnOrder', schema: ReturnSchema },
      { name: 'Invoice', schema: InvoiceSchema },
      { name: 'Collection', schema: CollectionSchema },
    ])
  ],
  controllers: [ExportsController],
  providers: [ExportsService],
  exports: [ExportsService]
})
export class ExportsModule {}
