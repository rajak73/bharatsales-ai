import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { IncentivesController } from './incentives.controller';
import { IncentivesService } from './incentives.service';
import { IncentivePlanSchema, IncentivePayoutSchema } from '../schemas/incentives.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'IncentivePlan', schema: IncentivePlanSchema },
      { name: 'IncentivePayout', schema: IncentivePayoutSchema },
    ]),
  ],
  controllers: [IncentivesController],
  providers: [IncentivesService],
  exports: [IncentivesService],
})
export class IncentivesModule {}
