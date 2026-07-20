import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Beat, BeatSchedule } from '../schemas';

@Injectable()
export class BeatsService {
  constructor(
    @InjectModel('Beat') private beatModel: Model<Beat>,
    @InjectModel('BeatSchedule') private beatScheduleModel: Model<BeatSchedule>
  ) {}

  async getTodayBeat(userId: string, organizationId: string) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const schedule = await this.beatScheduleModel.findOne({
      user: userId,
      organizationId,
    const schedule = await this.beatScheduleModel.findOne({
      user: userId,
      organizationId,
      date: { $gte: todayStart, $lte: todayEnd }
    }).populate({
      path: 'beat',
      match: { status: 'Active' },
      populate: {
        path: 'outlets'
      }
    }).exec();

    if (!schedule) {
      return null;
    }

    return schedule;
  }

  async getAllBeats(organizationId: string) {
    return this.beatModel.find({ organizationId }).populate('outlets').exec();
  }

  async createBeat(organizationId: string, data: Partial<Beat>) {
    const newBeat = new this.beatModel({
      ...data,
      organizationId,
      status: 'Draft',
      version: 1
    });
    return newBeat.save();
  }

  async updateBeat(organizationId: string, beatId: string, data: Partial<Beat>) {
    const updated = await this.beatModel.findOneAndUpdate(
      { _id: beatId, organizationId },
      { $set: data },
      { new: true }
    ).exec();
    
    if (!updated) {
      throw new Error(`Beat ${beatId} not found`);
    }
    
    return updated;
  }

  async publishBeat(organizationId: string, beatId: string) {
    const updated = await this.beatModel.findOneAndUpdate(
      { _id: beatId, organizationId },
      { $set: { status: 'Active' }, $inc: { version: 1 } },
      { new: true }
    ).exec();
    
    if (!updated) {
      throw new Error(`Beat ${beatId} not found`);
    }
    
    return updated;
  }
}
