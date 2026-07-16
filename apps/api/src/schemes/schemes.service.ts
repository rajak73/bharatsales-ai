import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Scheme } from '../schemas/scheme.schema';
import { Scheme as SharedScheme } from '@bharatsales/shared-types';

@Injectable()
export class SchemesService {
  private readonly logger = new Logger(SchemesService.name);

  constructor(@InjectModel(Scheme.name) private schemeModel: Model<Scheme>) {}

  async findAll(organizationId: string): Promise<Scheme[]> {
    return this.schemeModel.find({ organizationId }).exec();
  }

  async getActiveSchemes(organizationId: string): Promise<Scheme[]> {
    const today = new Date().toISOString();
    return this.schemeModel.find({
      organizationId,
      isActive: true,
      validFrom: { $lte: today },
      validUntil: { $gte: today }
    }).exec();
  }

  async create(organizationId: string, data: Omit<SharedScheme, 'id' | 'createdAt' | 'updatedAt' | 'organizationId'>): Promise<Scheme> {
    const newScheme = new this.schemeModel({
      ...data,
      organizationId,
    });
    return newScheme.save();
  }

  async deactivate(organizationId: string, schemeId: string): Promise<Scheme> {
    const scheme = await this.schemeModel.findOne({ _id: schemeId, organizationId });
    if (!scheme) {
      throw new NotFoundException('Scheme not found');
    }
    scheme.isActive = false;
    return scheme.save();
  }
}
