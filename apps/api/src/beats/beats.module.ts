import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BeatsController } from './beats.controller';
import { BeatsService } from './beats.service';
import { Beat, BeatSchema, BeatSchedule, BeatScheduleSchema } from '../schemas';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Beat.name, schema: BeatSchema },
      { name: BeatSchedule.name, schema: BeatScheduleSchema }
    ])
  ],
  controllers: [BeatsController],
  providers: [BeatsService],
  exports: [BeatsService],
})
export class BeatsModule {}
