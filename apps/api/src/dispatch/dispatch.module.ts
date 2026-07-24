import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DispatchController } from './dispatch.controller';
import { DispatchService } from './dispatch.service';
import { Dispatch, DispatchSchema } from '../schemas/dispatch.schema';

import { FinanceModule } from '../finance/finance.module';
import { IntegrationsModule } from '../integrations/integrations.module';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Dispatch.name, schema: DispatchSchema }]),
    FinanceModule,
    IntegrationsModule,
    InventoryModule
  ],
  controllers: [DispatchController],
  providers: [DispatchService],
  exports: [DispatchService],
})
export class DispatchModule {}
