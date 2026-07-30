import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Beat, BeatSchedule, Visit } from '../schemas';
import { HierarchyService } from '../hierarchy/hierarchy.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class BeatsService {
  private readonly logger = new Logger(BeatsService.name);

  constructor(
    @InjectModel('Beat') private beatModel: Model<Beat>,
    @InjectModel('BeatSchedule') private beatScheduleModel: Model<BeatSchedule>,
    @InjectModel('Visit') private visitModel: Model<Visit>,
    @InjectModel('User') private userModel: Model<any>,
    private hierarchyService: HierarchyService,
    private notificationsService: NotificationsService
  ) {}

  async getTodayBeat(userId: string, organizationId: string) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

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

    const scheduleObj = schedule.toObject() as any;
    
    // Calculate Beat Completion Percentage (BRD Phase 6)
    if (scheduleObj.beat && scheduleObj.beat.outlets && scheduleObj.beat.outlets.length > 0) {
      const totalOutlets = scheduleObj.beat.outlets.length;
      const completedVisits = await this.visitModel.countDocuments({
        user: userId,
        organizationId,
        status: 'Completed',
        checkInTime: { $gte: todayStart, $lte: todayEnd }
      });
      
      scheduleObj.completionPercentage = Math.round((completedVisits / totalOutlets) * 100);
      scheduleObj.completedVisits = completedVisits;
    } else {
      scheduleObj.completionPercentage = 0;
      scheduleObj.completedVisits = 0;
    }

    return scheduleObj;
  }

  async getAllBeats(organizationId: string) {
    return this.beatModel.find({ organizationId }).populate('outlets').exec();
  }

  async createBeat(organizationId: string, data: Partial<Beat>) {
    delete (data as any).organizationId;
    delete (data as any)._id;
    delete (data as any).createdAt;
    delete (data as any).updatedAt;
    const newBeat = new this.beatModel({
      ...data,
      organizationId,
      status: 'Draft',
      version: 1
    });
    return newBeat.save();
  }

  async updateBeat(organizationId: string, beatId: string, data: Partial<Beat>) {
    delete (data as any).organizationId;
    delete (data as any)._id;
    delete (data as any).createdAt;
    delete (data as any).updatedAt;
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

    const schedules = await this.beatScheduleModel.find({ beat: beatId, organizationId }).select('user').exec();
    const assignedUserIds = [...new Set(schedules.map((s: any) => s.user.toString()))];
    for (const userId of assignedUserIds) {
      this.notificationsService.create(organizationId, userId, {
        type: 'beat_assigned',
        title: 'Beat Assigned',
        message: `You have been assigned the "${updated.name}" beat.`
      }).catch(err => this.logger.error('Failed to create beat-assigned notification', err));
    }

    return updated;
  }

  // Aggregate beat completion % across a Sales Manager's team (or, for an
  // Organization Admin — who has no territoryIds of their own — every Sales
  // Representative in the org), for the Team Dashboard.
  async getTeamBeatCompletion(organizationId: string, managerId: string, role?: string) {
    const teamUserIds = role === 'Organization Admin'
      ? (await this.userModel.find({ organizationId, role: 'Sales Representative' }).select('_id').exec()).map((u: any) => u._id.toString())
      : await this.hierarchyService.getTeamUserIds(organizationId, managerId);
    if (teamUserIds.length === 0) {
      return { teamCompletionPercentage: 0, reps: [] };
    }

    const reps = await this.userModel.find({ _id: { $in: teamUserIds } }).select('name').exec();

    const perRep = await Promise.all(
      teamUserIds.map(async (userId) => {
        const schedule = await this.getTodayBeat(userId, organizationId);
        const repName = reps.find((r: any) => r._id.toString() === userId)?.name || userId;
        return {
          userId,
          name: repName,
          completionPercentage: schedule?.completionPercentage ?? 0,
          completedVisits: schedule?.completedVisits ?? 0,
          hasBeatToday: !!schedule
        };
      })
    );

    const withBeat = perRep.filter(r => r.hasBeatToday);
    const teamCompletionPercentage = withBeat.length > 0
      ? Math.round(withBeat.reduce((sum, r) => sum + r.completionPercentage, 0) / withBeat.length)
      : 0;

    return { teamCompletionPercentage, reps: perRep };
  }

  // Compares the planned outlet visit order (Beat.sequence) against the
  // actual order outlets were checked into today, for a given rep (BRD Phase 6).
  async checkRouteDeviation(organizationId: string, userId: string, date?: string) {
    const dayStart = date ? new Date(date) : new Date();
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);

    const schedule = await this.beatScheduleModel.findOne({
      user: userId,
      organizationId,
      date: { $gte: dayStart, $lte: dayEnd }
    }).populate('beat').exec();

    if (!schedule || !(schedule as any).beat) {
      return { hasPlan: false, deviations: [] };
    }

    const beat = (schedule as any).beat;
    const plannedSequence: { outletId: any; sequenceOrder: number }[] = beat.sequence || [];

    if (plannedSequence.length === 0) {
      return { hasPlan: false, deviations: [] };
    }

    const plannedOrder = [...plannedSequence]
      .sort((a, b) => a.sequenceOrder - b.sequenceOrder)
      .map(s => s.outletId.toString());

    const visits = await this.visitModel.find({
      user: userId,
      organizationId,
      checkInTime: { $gte: dayStart, $lte: dayEnd }
    }).sort({ checkInTime: 1 }).exec();

    const actualOrder = visits.map(v => v.outlet.toString());
    const actualSet = new Set(actualOrder);

    const skipped = plannedOrder.filter(outletId => !actualSet.has(outletId));

    const visitedPlanned = actualOrder.filter(outletId => plannedOrder.includes(outletId));
    const outOfSequence: string[] = [];
    for (let i = 0; i < visitedPlanned.length; i++) {
      const expectedIndex = plannedOrder.indexOf(visitedPlanned[i]);
      const previousExpectedIndex = i > 0 ? plannedOrder.indexOf(visitedPlanned[i - 1]) : -1;
      if (expectedIndex < previousExpectedIndex) {
        outOfSequence.push(visitedPlanned[i]);
      }
    }

    return {
      hasPlan: true,
      plannedOrder,
      actualOrder,
      deviations: {
        skippedOutlets: skipped,
        outOfSequenceOutlets: outOfSequence
      }
    };
  }

  // Notifies reps who left outlets un-visited on a completed beat day (BRD "missed outlet").
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async notifyMissedOutlets() {
    this.logger.log('Running missed-outlet notification cron...');
    const dayStart = new Date();
    dayStart.setDate(dayStart.getDate() - 1);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);

    const schedules = await this.beatScheduleModel.find({
      date: { $gte: dayStart, $lte: dayEnd }
    }).populate({ path: 'beat', match: { status: 'Active' } }).exec();

    for (const schedule of schedules) {
      try {
        const beat = (schedule as any).beat;
        if (!beat || !beat.outlets || beat.outlets.length === 0) continue;

        const userId = (schedule as any).user.toString();
        const organizationId = (schedule as any).organizationId.toString();
        const plannedOutletIds = beat.outlets.map((o: any) => o.toString());

        const visits = await this.visitModel.find({
          user: userId,
          organizationId,
          status: 'Completed',
          checkInTime: { $gte: dayStart, $lte: dayEnd }
        }).select('outlet').exec();
        const visitedOutletIds = new Set(visits.map((v: any) => v.outlet.toString()));

        const missedCount = plannedOutletIds.filter((id: string) => !visitedOutletIds.has(id)).length;
        if (missedCount > 0) {
          await this.notificationsService.create(organizationId, userId, {
            type: 'missed_outlet',
            title: 'Missed Outlets',
            message: `You missed ${missedCount} outlet${missedCount > 1 ? 's' : ''} on your beat yesterday.`
          });
        }
      } catch (error) {
        this.logger.error(`Failed to process missed-outlet check for schedule ${schedule._id}`, error);
      }
    }
  }
}
