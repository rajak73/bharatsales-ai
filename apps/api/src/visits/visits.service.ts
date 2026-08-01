import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Visit } from '../schemas/visit.schema';
import { Outlet } from '../schemas/outlet.schema';
import { Order } from '@bharatsales/shared-types';
import { calculateDistanceMeters } from '../common/geo.util';

@Injectable()
export class VisitsService {
  constructor(
    @InjectModel('Visit') private visitModel: Model<Visit>,
    @InjectModel('Outlet') private outletModel: Model<Outlet>,
    @InjectModel('Order') private orderModel: Model<Order>
  ) {}

  async checkIn(userId: string, organizationId: string, data: { outletId: string; lat: number; lng: number; accuracy: number; isMock?: boolean; deviceTimestamp?: string; photoUrl?: string; idempotencyKey?: string }) {
    // Retry of a previously-synced check-in (e.g. offline-first client resubmit)
    if (data.idempotencyKey) {
      const existingByKey = await this.visitModel.findOne({ organizationId, idempotencyKey: data.idempotencyKey });
      if (existingByKey) {
        return existingByKey;
      }
    }

    // Check if user already has an active visit
    const existingVisit = await this.visitModel.findOne({ user: userId, organizationId, status: 'Active' });
    if (existingVisit) {
      if (existingVisit.outlet.toString() === data.outletId) {
        return existingVisit; // Idempotent
      }
      throw new BadRequestException('You already have an active visit at another outlet.');
    }
    if (!Types.ObjectId.isValid(data.outletId)) {
      throw new BadRequestException('Invalid outlet ID format');
    }

    const outlet = await this.outletModel.findOne({ _id: data.outletId, organizationId }).lean();
    if (!outlet) {
      throw new NotFoundException('Outlet not found');
    }

    let distanceFromOutlet = 0;
    let isWithinGeofence = true;
    
    // Enforce GPS Validation (BRD Phase 6)
    // Use the outlet's configured radius, falling back to 50 meters if undefined.
    const GEOFENCE_RADIUS = outlet.location?.geofenceRadiusMeters || 50; 

    if (data.isMock) {
      throw new BadRequestException('Mock locations are not allowed for check-in.');
    }

    if (!data.photoUrl) {
      throw new BadRequestException('A shopfront photo is mandatory for check-in.');
    }

    if (data.deviceTimestamp) {
      const deviceTime = new Date(data.deviceTimestamp).getTime();
      const serverTime = Date.now();
      const diffMinutes = Math.abs(serverTime - deviceTime) / (1000 * 60);
      if (diffMinutes > 5) {
        throw new BadRequestException('Device time deviation is too large. Please sync your clock.');
      }
    }

    const outletLat = outlet.location?.latitude ?? (outlet.location as any)?.coordinates?.lat;
    const outletLng = outlet.location?.longitude ?? (outlet.location as any)?.coordinates?.lng;

    if (outletLat !== undefined && outletLng !== undefined) {
      distanceFromOutlet = calculateDistanceMeters(
        data.lat,
        data.lng,
        outletLat,
        outletLng
      );
      isWithinGeofence = distanceFromOutlet <= GEOFENCE_RADIUS;
    }

    if (!isWithinGeofence) {
      throw new BadRequestException(`Check-in blocked. You are ${Math.round(distanceFromOutlet)}m away from the outlet. Must be within ${GEOFENCE_RADIUS}m.`);
    }

    const visit = new this.visitModel({
      user: userId,
      outlet: data.outletId,
      organizationId,
      checkInTime: new Date(),
      checkInLocation: { lat: data.lat, lng: data.lng, accuracy: data.accuracy },
      distanceFromOutlet: Math.round(distanceFromOutlet),
      isWithinGeofence,
      photoUrl: data.photoUrl,
      idempotencyKey: data.idempotencyKey,
      status: 'Active'
    });

    return visit.save();
  }

  async checkOut(userId: string, organizationId: string, visitId: string) {
    const visit = await this.visitModel.findOne({ _id: visitId, user: userId, organizationId, status: 'Active' });
    if (!visit) {
      throw new NotFoundException('Active visit not found');
    }

    // Verify Business Logic: Visit cannot complete if Draft Order exists
    const draftOrder = await this.orderModel.findOne({
      createdByUserId: userId,
      outletId: visit.outlet,
      status: 'Draft',
      createdAt: { $gte: visit.checkInTime }
    });

    if (draftOrder) {
      throw new BadRequestException('Checkout blocked: You have a Draft order pending. Please submit or cancel it before checking out.');
    }

    const checkOutTime = new Date();
    visit.checkOutTime = checkOutTime;
    visit.status = 'Completed';
    
    // Calculate visit duration in minutes
    if (visit.checkInTime) {
      const diffMs = checkOutTime.getTime() - new Date(visit.checkInTime).getTime();
      visit.durationMinutes = Math.round(diffMs / 60000);
    }

    return visit.save();
  }

  async addActivity(userId: string, organizationId: string, visitId: string, activity: any) {
    const visit = await this.visitModel.findOne({ _id: visitId, user: userId, organizationId, status: 'Active' });
    if (!visit) {
      throw new NotFoundException('Active visit not found or already completed');
    }

    visit.activities = visit.activities || [];
    visit.activities.push({
      ...activity,
      timestamp: new Date()
    });

    return visit.save();
  }
}
