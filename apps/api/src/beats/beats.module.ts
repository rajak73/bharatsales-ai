import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BeatsController } from './beats.controller';
import { BeatsService } from './beats.service';
import { Beat, BeatSchema, BeatSchedule, BeatScheduleSchema, Visit, VisitSchema } from '../schemas';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Beat.name, schema: BeatSchema },
      { name: BeatSchedule.name, schema: BeatScheduleSchema },
      { name: Visit.name, schema: VisitSchema }
    ])
  ],
  controllers: [BeatsController],
  providers: [BeatsService],
  exports: [BeatsService],
})
export class BeatsModule {}
