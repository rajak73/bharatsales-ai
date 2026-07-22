import { Injectable, NotFoundException } from '@nestjs/common';
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

  async create(organizationId: string, data: any): Promise<Device> {
    delete data.organizationId;
    delete data._id;
    delete data.createdAt;
    delete data.updatedAt;

    const newDevice = new this.deviceModel({
      ...data,
      organizationId,
    });
    return newDevice.save();
  }

  async update(organizationId: string, id: string, data: any): Promise<Device> {
    delete data.organizationId;
    delete data._id;
    delete data.createdAt;
    delete data.updatedAt;

    const device = await this.deviceModel.findOneAndUpdate(
      { _id: id, organizationId },
      { $set: data },
      { new: true }
    ).exec();
    
    if (!device) {
      throw new NotFoundException('Device not found');
    }
    
    return device;
  }

  async remove(organizationId: string, id: string): Promise<{ deleted: boolean }> {
    const device = await this.deviceModel.findOneAndDelete({ _id: id, organizationId }).exec();
    if (!device) {
      throw new NotFoundException('Device not found');
    }
    return { deleted: true };
  }
}
