import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { AttendanceSessionSchema } from '../schemas/attendance.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'AttendanceSession', schema: AttendanceSessionSchema }])
  ],
  controllers: [AttendanceController],
  providers: [AttendanceService],
  exports: [AttendanceService],
})
export class AttendanceModule {}
