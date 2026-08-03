import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Scheme } from '../schemas/scheme.schema';
import { Scheme as SharedScheme } from '@bharatsales/shared-types';

@Injectable()
export class SchemesService {
  constructor(@InjectModel('Scheme') private schemeModel: Model<Scheme>) {}

  async findAllByOrgId(organizationId: string): Promise<Scheme[]> {
    return this.schemeModel.find({ organizationId }).exec();
  }

  async create(organizationId: string, data: Omit<SharedScheme, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>): Promise<Scheme> {
    delete (data as any).organizationId;
    delete (data as any)._id;
    delete (data as any).createdAt;
    delete (data as any).updatedAt;
    const newScheme = new this.schemeModel({ ...data, organizationId });
    return newScheme.save();
  }

  async update(organizationId: string, id: string, data: Partial<SharedScheme>): Promise<Scheme> {
    delete (data as any).organizationId;
    delete (data as any)._id;
    delete (data as any).createdAt;
    delete (data as any).updatedAt;
    const scheme = await this.schemeModel.findOneAndUpdate(
      { _id: id, organizationId },
      { $set: data },
      { new: true }
    ).exec();
    if (!scheme) throw new NotFoundException('Scheme not found');
    return scheme;
  }

  async remove(organizationId: string, id: string): Promise<{ deleted: boolean }> {
    const scheme = await this.schemeModel.findOneAndDelete({ _id: id, organizationId }).exec();
    if (!scheme) throw new NotFoundException('Scheme not found');
    return { deleted: true };
  }
}
