import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TargetsController } from './targets.controller';
import { TargetsService } from './targets.service';
import { TargetSchema, OrderSchema } from '../schemas';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Target', schema: TargetSchema },
      { name: 'Order', schema: OrderSchema }
    ])
  ],
  controllers: [TargetsController],
  providers: [TargetsService]
})
export class TargetsModule {}
