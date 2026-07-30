import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DispatchController } from './dispatch.controller';
import { DispatchService } from './dispatch.service';
import { DispatchSchema } from '../schemas/dispatch.schema';
import { OrderSchema } from '../schemas/order.schema';
import { OrdersModule } from '../orders/orders.module';
import { ReturnsModule } from '../returns/returns.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Dispatch', schema: DispatchSchema },
      { name: 'Order', schema: OrderSchema },
    ]),
    OrdersModule,
    ReturnsModule,
  ],
  controllers: [DispatchController],
  providers: [DispatchService],
  exports: [DispatchService],
})
export class DispatchModule {}
