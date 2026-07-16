import { Module } from '@nestjs/common';
import { LiveMapController } from './live-map.controller';
import { LiveMapService } from './live-map.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema, OutletSchema, AttendanceSessionSchema, VisitSchema } from '../schemas';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'User', schema: UserSchema },
      { name: 'Outlet', schema: OutletSchema },
      { name: 'AttendanceSession', schema: AttendanceSessionSchema },
      { name: 'Visit', schema: VisitSchema }
    ])
  ],
  controllers: [LiveMapController],
  providers: [LiveMapService],
})
export class LiveMapModule {}
