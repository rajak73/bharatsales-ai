import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { AttendanceSessionSchema } from '../schemas/attendance.schema';
import { VisitSchema } from '../schemas/visit.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'AttendanceSession', schema: AttendanceSessionSchema },
      { name: 'Visit', schema: VisitSchema }
    ])
  ],
  controllers: [AttendanceController],
  providers: [AttendanceService],
  exports: [AttendanceService],
})
export class AttendanceModule {}
