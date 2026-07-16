import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PerformanceController } from './performance.controller';
import { PerformanceService } from './performance.service';
import { TargetSchema } from '../schemas/target.schema';
import { OrderSchema } from '../schemas/order.schema';
import { CollectionSchema } from '../schemas/collection.schema';
import { VisitSchema } from '../schemas/visit.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Target', schema: TargetSchema },
      { name: 'Order', schema: OrderSchema },
      { name: 'Collection', schema: CollectionSchema },
      { name: 'Visit', schema: VisitSchema }
    ])
  ],
  controllers: [PerformanceController],
  providers: [PerformanceService],
  exports: [PerformanceService],
})
export class PerformanceModule {}
