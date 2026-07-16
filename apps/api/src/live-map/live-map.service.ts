import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class LiveMapService {
  constructor(
    @InjectModel('AttendanceSession') private readonly attendanceModel: Model<any>,
    @InjectModel('Visit') private readonly visitModel: Model<any>,
  ) {}

  async getLiveReps(organizationId: string) {
    const activeSessions = await this.attendanceModel.find({ status: 'Active' }).populate('user', 'name');

    const reps = await Promise.all(
      activeSessions.map(async (session) => {
        // Find any active visits for this user
        const activeVisit = await this.visitModel.findOne({
          user: session.user._id,
          status: 'Active',
        }).populate('outlet', 'name').sort({ checkInTime: -1 });

        let status = 'Traveling';
        let location = session.startLocation;
        let outletName = 'In Transit';

        if (activeVisit) {
          status = 'At Outlet';
          location = activeVisit.checkInLocation || session.startLocation;
          outletName = activeVisit.outlet?.name || 'Unknown Outlet';
        }

        return {
          id: session.user._id.toString(),
          name: session.user.name,
          status,
          outlet: outletName,
          lastUpdate: new Date().toLocaleTimeString(), // just for UI demonstration
          location: {
            lat: location?.lat || 28.6139,
            lng: location?.lng || 77.2090
          },
        };
      })
    );

    return reps;
  }
}
