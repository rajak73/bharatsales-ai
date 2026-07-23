import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { LocationPing } from '../schemas';
import { AttendanceSession } from '../schemas/attendance.schema';

@Injectable()
export class TrackingService {
  private readonly logger = new Logger(TrackingService.name);

  constructor(
    @InjectModel('LocationPing') private locationPingModel: Model<LocationPing>,
    @InjectModel('AttendanceSession') private attendanceModel: Model<AttendanceSession>
  ) {}

  async bulkCreatePings(userId: string, organizationId: string, pings: any[]) {
    if (!pings || !pings.length) {
      return { success: true, count: 0 };
    }

    // Verify active attendance session
    const activeSession = await this.attendanceModel.findOne({ user: userId, status: 'Active' });
    if (!activeSession) {
      // Ping before Start Day or after End Day rejected
      this.logger.warn(`Rejected pings for user ${userId}: No active attendance session`);
      return { success: false, message: 'No active attendance session', count: 0 };
    }

    const validPings = [];
    const serverTime = Date.now();

    for (const ping of pings) {
      // 1. Mock-location risk
      if (ping.isMock) {
        continue; // Drop mock locations
      }

      // 2. Poor accuracy
      if (ping.accuracy && ping.accuracy > 100) {
        continue; // Drop pings with > 100m accuracy
      }

      // 3. Stale or future timestamp
      if (ping.deviceTimestamp) {
        const pingTime = new Date(ping.deviceTimestamp).getTime();
        const diffMinutes = Math.abs(serverTime - pingTime) / (1000 * 60);
        if (diffMinutes > 5) {
          continue; // Drop stale/future pings
        }
      }

      validPings.push({
        user: userId,
        organizationId,
        attendanceSession: activeSession._id,
        lat: ping.lat,
        lng: ping.lng,
        accuracy: ping.accuracy,
        deviceTimestamp: new Date(ping.deviceTimestamp),
      });
    }

    if (validPings.length === 0) {
       return { success: true, count: 0, message: 'All pings were rejected due to security or accuracy constraints.' };
    }

    await this.locationPingModel.insertMany(validPings, { ordered: false });
    this.logger.log(`Inserted ${validPings.length} location pings for user ${userId}`);

    return { success: true, count: validPings.length };
  }

  async getLatestPings(organizationId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let orgObjId;
    try {
      orgObjId = new Types.ObjectId(organizationId);
    } catch {
      orgObjId = organizationId;
    }

    return this.locationPingModel.aggregate([
      { 
        $match: { 
          organizationId: orgObjId,
          deviceTimestamp: { $gte: today }
        } 
      },
      {
        $sort: { deviceTimestamp: -1 }
      },
      {
        $group: {
          _id: '$user',
          latestPing: { $first: '$$ROOT' }
        }
      }
    ]).exec();
  }
}
