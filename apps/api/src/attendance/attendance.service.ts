import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AttendanceSession } from '../schemas/attendance.schema';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectModel('AttendanceSession') private attendanceModel: Model<AttendanceSession>
  ) {}

  async startDay(userId: string, organizationId: string, data: { lat: number; lng: number; accuracy: number; deviceTimestamp: string }) {
    // Check if there is already an active session for today
    const existing = await this.attendanceModel.findOne({ user: userId, status: 'Active' });
    if (existing) {
      // Return the existing one (idempotent behavior requested in BRD)
      return existing;
    }

    const session = new this.attendanceModel({
      user: userId,
      organizationId,
      startTime: new Date(),
      startLocation: { lat: data.lat, lng: data.lng, accuracy: data.accuracy },
      status: 'Active',
      deviceTimestamp: data.deviceTimestamp ? new Date(data.deviceTimestamp) : undefined,
    });
    return session.save();
  }

  async endDay(userId: string, data: { lat: number; lng: number; accuracy: number }) {
    const session = await this.attendanceModel.findOne({ user: userId, status: 'Active' });
    if (!session) {
      throw new NotFoundException('No active attendance session found');
    }

    session.endTime = new Date();
    session.endLocation = { lat: data.lat, lng: data.lng, accuracy: data.accuracy };
    session.status = 'Completed';
    return session.save();
  }

  async getCurrentSession(userId: string) {
    const session = await this.attendanceModel.findOne({ user: userId, status: 'Active' });
    return session || null;
  }
}
