import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DispatchController } from './dispatch.controller';
import { DispatchService } from './dispatch.service';
import { Dispatch, DispatchSchema } from '../schemas/dispatch.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Dispatch.name, schema: DispatchSchema }]),
  ],
  controllers: [DispatchController],
  providers: [DispatchService],
  exports: [DispatchService],
})
export class DispatchModule {}
