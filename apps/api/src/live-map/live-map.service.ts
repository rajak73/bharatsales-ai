import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class LiveMapService {
  constructor(
    @InjectModel('AttendanceSession') private readonly attendanceModel: Model<any>,
    @InjectModel('Visit') private readonly visitModel: Model<any>,
    @InjectModel('LocationPing') private readonly locationPingModel: Model<any>,
  ) {}

  async getLiveReps(organizationId: string) {
    const activeSessions = await this.attendanceModel.find({ status: { $in: ['Active', 'On_Break'] } }).populate('user', 'name');
    
    // Filter out any corrupted sessions where the user was deleted
    const validSessions = activeSessions.filter(session => session.user != null);

    const reps = await Promise.all(
      validSessions.map(async (session) => {
        // Find any active visits for this user
        const activeVisit = await this.visitModel.findOne({
          user: session.user._id,
          status: 'Active',
        }).populate('outlet', 'name').sort({ checkInTime: -1 });

        // Find the latest location ping for this user
        const latestPing = await this.locationPingModel.findOne({
          user: session.user._id,
          organizationId
        }).sort({ deviceTimestamp: -1 });

        let status = 'Traveling';
        let location = session.startLocation;
        let outletName = 'In Transit';

        if (latestPing) {
          location = { lat: latestPing.lat, lng: latestPing.lng };
        }

        if (activeVisit) {
          status = 'At Outlet';
          location = activeVisit.checkInLocation || location || session.startLocation;
          outletName = activeVisit.outlet?.name || 'Unknown Outlet';
        }

        const now = new Date();
        const staleThreshold = new Date(now.getTime() - 15 * 60 * 1000); // 15 mins
        const lastActivityTime = latestPing ? latestPing.deviceTimestamp : session.startTime;
        let isStale = false;
        
        if (lastActivityTime && lastActivityTime < staleThreshold) {
            status = 'Offline';
            isStale = true;
        }

        let timeString = 'Unknown';
        if (latestPing && latestPing.deviceTimestamp) {
           timeString = new Date(latestPing.deviceTimestamp).toLocaleTimeString();
        } else if (session.startTime) {
           timeString = new Date(session.startTime).toLocaleTimeString();
        }

        return {
          id: session.user._id.toString(),
          name: session.user.name,
          status,
          outlet: isStale ? 'No signal > 15m' : outletName,
          lastUpdate: isStale ? `Stale since ${timeString}` : timeString,
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
