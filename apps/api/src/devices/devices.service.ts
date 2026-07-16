import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Device } from '../schemas/device.schema';
import { Device as SharedDevice } from '@bharatsales/shared-types';

@Injectable()
export class DevicesService {
  constructor(
    @InjectModel(Device.name) private deviceModel: Model<Device>,
  ) {}

  async findAllByOrgId(organizationId: string): Promise<SharedDevice[]> {
    const records = await this.deviceModel.find({ organizationId }).exec();
    if (records.length === 0) {
      const defaults = [
        { organizationId, deviceId: 'DEV-8821', user: 'Amit Patel', model: 'Samsung Galaxy Tab S7', os: 'Android 13', appVersion: 'v2.1.0', lastSync: '10 mins ago', status: 'Online' as const },
        { organizationId, deviceId: 'DEV-4451', user: 'Rahul Singh', model: 'Motorola Edge 40', os: 'Android 13', appVersion: 'v2.0.5', lastSync: '2 hours ago', status: 'Offline' as const },
      ];
      await this.deviceModel.insertMany(defaults);
      const newRecords = await this.deviceModel.find({ organizationId }).exec();
      return newRecords.map(doc => ({
        id: doc.id,
        organizationId: doc.organizationId,
        deviceId: doc.deviceId,
        user: doc.user,
        model: doc.deviceModel,
        os: doc.os,
        appVersion: doc.appVersion,
        lastSync: doc.lastSync,
        status: doc.status,
        trusted: true,
      }));
    }
    return records.map(doc => ({
      id: doc.id,
      organizationId: doc.organizationId,
      deviceId: doc.deviceId,
      user: doc.user,
      model: doc.deviceModel,
      os: doc.os,
      appVersion: doc.appVersion,
      lastSync: doc.lastSync,
      status: doc.status,
      trusted: true,
    }));
  }
}
