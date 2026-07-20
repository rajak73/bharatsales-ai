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
      return [];
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
