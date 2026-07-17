import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TaxRatesController } from './tax-rates.controller';
import { TaxRatesService } from './tax-rates.service';
import { TaxRateSchema } from '../schemas';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'TaxRate', schema: TaxRateSchema }]),
    AuditModule,
  ],
  controllers: [TaxRatesController],
  providers: [TaxRatesService],
  exports: [TaxRatesService],
})
export class TaxRatesModule {}
