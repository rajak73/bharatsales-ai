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

  async startDay(userId: string, organizationId: string, data: { lat: number; lng: number; accuracy: number; deviceTimestamp: string; isMock?: boolean; photoUrl?: string }) {
    const existing = await this.attendanceModel.findOne({ user: userId, status: { $in: ['Active', 'On_Break'] } });
    if (existing) {
      return existing;
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const completedToday = await this.attendanceModel.findOne({
      user: userId,
      status: 'Completed',
      startTime: { $gte: startOfDay, $lte: endOfDay }
    });

    if (completedToday) {
      throw new BadRequestException('You have already completed your day today. Cannot start a new day.');
    }

    if (data.isMock) {
      throw new BadRequestException('Mock locations are not allowed for attendance.');
    }

    // Photo is optional according to BRD policy, so we do not enforce it globally here
    if (data.photoUrl === 'STRICT_POLICY_ENFORCED') {
      throw new BadRequestException('A selfie photo is mandatory for starting the day according to your policy.');
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
      photoUrl: data.photoUrl,
    });
    return session.save();
  }

  async requestRegularization(userId: string, sessionId: string, reason: string) {
    const session = await this.attendanceModel.findOne({ _id: sessionId, user: userId });
    if (!session) {
      throw new NotFoundException('Session not found');
    }
    if (session.regularizationStatus === 'PENDING') {
      throw new ConflictException('A regularization request is already pending for this session');
    }
    session.regularizationStatus = 'PENDING';
    session.regularizationReason = reason;
    return session.save();
  }

  async approveRegularization(sessionId: string, status: 'APPROVED' | 'REJECTED') {
    const session = await this.attendanceModel.findById(sessionId);
    if (!session) {
      throw new NotFoundException('Session not found');
    }
    session.regularizationStatus = status;
    return session.save();
  }

  async endDay(userId: string, data: { lat: number; lng: number; accuracy: number }) {
    const session = await this.attendanceModel.findOne({ user: userId, status: { $in: ['Active', 'On_Break'] } });
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
    const session = await this.attendanceModel.findOne({ user: userId, status: { $in: ['Active', 'On_Break'] } });
    return session || null;
  }

  async takeBreak(userId: string) {
    const session = await this.attendanceModel.findOne({ user: userId, status: 'Active' });
    if (!session) {
      throw new BadRequestException('No active session found to take a break from.');
    }
    session.status = 'On_Break';
    return session.save();
  }

  async resumeDay(userId: string) {
    const session = await this.attendanceModel.findOne({ user: userId, status: 'On_Break' });
    if (!session) {
      throw new BadRequestException('You are not currently on a break.');
    }
    session.status = 'Active';
    return session.save();
  }
}
