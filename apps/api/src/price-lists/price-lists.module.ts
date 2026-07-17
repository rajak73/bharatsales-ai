import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PriceListsController } from './price-lists.controller';
import { PriceListsService } from './price-lists.service';
import { PriceListSchema } from '../schemas';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'PriceList', schema: PriceListSchema }]),
    AuditModule,
  ],
  controllers: [PriceListsController],
  providers: [PriceListsService],
  exports: [PriceListsService],
})
export class PriceListsModule {}
