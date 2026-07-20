import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { OrderSchema } from '../schemas/order.schema';
import { CollectionSchema } from '../schemas/collection.schema';
import { VisitSchema } from '../schemas/visit.schema';
import { UserSchema } from '../schemas/user.schema';
import { OutletSchema } from '../schemas/outlet.schema';
import { TargetSchema } from '../schemas/target.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Order', schema: OrderSchema },
      { name: 'Collection', schema: CollectionSchema },
      { name: 'Visit', schema: VisitSchema },
      { name: 'User', schema: UserSchema },
      { name: 'Outlet', schema: OutletSchema },
      { name: 'Target', schema: TargetSchema }
    ])
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
