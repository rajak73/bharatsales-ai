import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CollectionsController } from './collections.controller';
import { CollectionsService } from './collections.service';
import { CollectionSchema } from '../schemas/collection.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Collection', schema: CollectionSchema }])
  ],
  controllers: [CollectionsController],
  providers: [CollectionsService],
})
export class CollectionsModule {}
