import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AiFeaturesController } from './ai-features.controller';
import { AiFeaturesService } from './ai-features.service';
import { OrderSchema, CollectionSchema, OutletSchema } from '../schemas';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Order', schema: OrderSchema },
      { name: 'Collection', schema: CollectionSchema },
      { name: 'Outlet', schema: OutletSchema }
    ])
  ],
  controllers: [AiFeaturesController],
  providers: [AiFeaturesService],
  exports: [AiFeaturesService],
})
export class AiFeaturesModule {}
