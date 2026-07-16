import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';
import { InvoiceSchema } from '../schemas/invoice.schema';
import { CollectionSchema } from '../schemas/collection.schema';
import { OutletSchema } from '../schemas/outlet.schema';
import { OrderSchema } from '../schemas/order.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Invoice', schema: InvoiceSchema },
      { name: 'Collection', schema: CollectionSchema },
      { name: 'Outlet', schema: OutletSchema },
      { name: 'Order', schema: OrderSchema }
    ])
  ],
  controllers: [FinanceController],
  providers: [FinanceService],
  exports: [FinanceService],
})
export class FinanceModule {}
