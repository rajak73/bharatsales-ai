import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LocationPing } from '../schemas';

@Injectable()
export class TrackingService {
  private readonly logger = new Logger(TrackingService.name);

  constructor(
    @InjectModel('LocationPing') private locationPingModel: Model<LocationPing>
  ) {}

  async bulkCreatePings(userId: string, organizationId: string, pings: any[]) {
    if (!pings || !pings.length) {
      return { success: true, count: 0 };
    }

    const docs = pings.map(ping => ({
      user: userId,
      organizationId,
      attendanceSession: ping.attendanceSession,
      lat: ping.lat,
      lng: ping.lng,
      accuracy: ping.accuracy,
      deviceTimestamp: new Date(ping.deviceTimestamp),
    }));

    await this.locationPingModel.insertMany(docs, { ordered: false });
    this.logger.log(`Inserted ${docs.length} location pings for user ${userId}`);

    return { success: true, count: docs.length };
  }
}
