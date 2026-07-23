import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AttendanceSession } from '../schemas/attendance.schema';
import { Visit } from '../schemas/visit.schema';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectModel('AttendanceSession') private attendanceModel: Model<AttendanceSession>,
    @InjectModel('Visit') private visitModel: Model<Visit>
  ) {}

  async startDay(userId: string, organizationId: string, data: { lat: number; lng: number; accuracy: number; deviceTimestamp: string; isMock?: boolean }) {
    // Check if there is already an active session for today
    const existing = await this.attendanceModel.findOne({ user: userId, status: 'Active' });
    if (existing) {
      // Return the existing one (idempotent behavior requested in BRD)
      return existing;
    }

    if (data.isMock) {
      throw new BadRequestException('Mock locations are not allowed for attendance.');
    }

    if (data.deviceTimestamp) {
      const deviceTime = new Date(data.deviceTimestamp).getTime();
      const serverTime = Date.now();
      const diffMinutes = Math.abs(serverTime - deviceTime) / (1000 * 60);
      if (diffMinutes > 5) {
        throw new BadRequestException('Device time deviation is too large. Please sync your clock.');
      }
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
    await session.save();

    // Auto check-out any active visits
    await this.visitModel.updateMany(
      { user: userId, status: 'Active' },
      { $set: { status: 'Completed', checkOutTime: new Date() } }
    );

    return session;
  }

  async getCurrentSession(userId: string) {
    const session = await this.attendanceModel.findOne({ user: userId, status: 'Active' });
    return session || null;
  }
}
