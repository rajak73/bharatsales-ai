import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TrackingController } from './tracking.controller';
import { TrackingService } from './tracking.service';
import { LocationPing, LocationPingSchema } from '../schemas';
import { AttendanceSession, AttendanceSessionSchema } from '../schemas/attendance.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LocationPing.name, schema: LocationPingSchema },
      { name: AttendanceSession.name, schema: AttendanceSessionSchema }
    ])
  ],
  controllers: [TrackingController],
  providers: [TrackingService],
  exports: [TrackingService],
})
export class TrackingModule {}
