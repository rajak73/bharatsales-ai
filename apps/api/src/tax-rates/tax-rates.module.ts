import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { TaxRatesController } from './tax-rates.controller';
import { TaxRatesService } from './tax-rates.service';
import { TaxRateSchema } from '../schemas/tax-rate.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'TaxRate', schema: TaxRateSchema }]),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [TaxRatesController],
  providers: [TaxRatesService],
})
export class TaxRatesModule {}
