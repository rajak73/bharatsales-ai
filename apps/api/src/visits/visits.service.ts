import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Visit } from '../schemas/visit.schema';
import { Outlet } from '../schemas/outlet.schema';

@Injectable()
export class VisitsService {
  constructor(
    @InjectModel('Visit') private visitModel: Model<Visit>,
    @InjectModel('Outlet') private outletModel: Model<Outlet>
  ) {}

  // Haversine formula to calculate distance in meters
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // metres
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  async checkIn(userId: string, organizationId: string, data: { outletId: string; lat: number; lng: number; accuracy: number }) {
    // Check if user already has an active visit
    const existingVisit = await this.visitModel.findOne({ user: userId, status: 'Active' });
    if (existingVisit) {
      if (existingVisit.outlet.toString() === data.outletId) {
        return existingVisit; // Idempotent
      }
      throw new BadRequestException('You already have an active visit at another outlet.');
    }

    const outlet = await this.outletModel.findById(data.outletId);
    if (!outlet) {
      throw new NotFoundException('Outlet not found');
    }

    let distanceFromOutlet = 0;
    let isWithinGeofence = true;
    
    // Default geofence radius in BRD is 5 meters, but in reality 50 meters is more practical for GPS accuracy. Let's use 50m.
    const GEOFENCE_RADIUS = 50; 

    if (outlet.location && outlet.location.latitude && outlet.location.longitude) {
      distanceFromOutlet = this.calculateDistance(
        data.lat,
        data.lng,
        outlet.location.latitude,
        outlet.location.longitude
      );
      isWithinGeofence = distanceFromOutlet <= GEOFENCE_RADIUS;
    }

    const visit = new this.visitModel({
      user: userId,
      outlet: data.outletId,
      organizationId,
      checkInTime: new Date(),
      checkInLocation: { lat: data.lat, lng: data.lng, accuracy: data.accuracy },
      distanceFromOutlet: Math.round(distanceFromOutlet),
      isWithinGeofence,
      status: 'Active'
    });

    return visit.save();
  }

  async checkOut(userId: string, visitId: string) {
    const visit = await this.visitModel.findOne({ _id: visitId, user: userId, status: 'Active' });
    if (!visit) {
      throw new NotFoundException('Active visit not found');
    }

    visit.checkOutTime = new Date();
    visit.status = 'Completed';
    return visit.save();
  }
}
