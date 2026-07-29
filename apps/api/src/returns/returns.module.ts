import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReturnsController } from './returns.controller';
import { ReturnsService } from './returns.service';
import { ReturnOrder, ReturnSchema } from '../schemas/return.schema';
import { Outlet, OutletSchema, Invoice, InvoiceSchema, Order, OrderSchema, Product, ProductSchema } from '../schemas';
import { InventoryModule } from '../inventory/inventory.module';
import { FinanceModule } from '../finance/finance.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ReturnOrder.name, schema: ReturnSchema },
      { name: 'Outlet', schema: OutletSchema },
      { name: 'Invoice', schema: InvoiceSchema },
      { name: 'Order', schema: OrderSchema },
      { name: 'Product', schema: ProductSchema },
    ]),
    InventoryModule,
    FinanceModule,
  ],
  controllers: [ReturnsController],
  providers: [ReturnsService],
  exports: [ReturnsService],
})
export class ReturnsModule {}
