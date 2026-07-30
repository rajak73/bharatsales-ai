import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TargetsController } from './targets.controller';
import { TargetsService } from './targets.service';
import { TargetSchema, OrderSchema } from '../schemas';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Target', schema: TargetSchema },
      { name: 'Order', schema: OrderSchema }
    ]),
    NotificationsModule
  ],
  controllers: [TargetsController],
  providers: [TargetsService],
  exports: [TargetsService]
})
export class TargetsModule {}
