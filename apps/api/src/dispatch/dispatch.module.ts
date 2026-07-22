import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DispatchController } from './dispatch.controller';
import { DispatchService } from './dispatch.service';
import { Dispatch, DispatchSchema } from '../schemas/dispatch.schema';
import { OrdersModule } from '../orders/orders.module';
import { FinanceModule } from '../finance/finance.module';
import { IntegrationsModule } from '../integrations/integrations.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Dispatch.name, schema: DispatchSchema }]),
    forwardRef(() => OrdersModule),
    FinanceModule,
    IntegrationsModule
  ],
  controllers: [DispatchController],
  providers: [DispatchService],
  exports: [DispatchService],
})
export class DispatchModule {}
