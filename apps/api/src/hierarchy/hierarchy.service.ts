import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { HierarchyNode } from '@bharatsales/shared-types';

@Injectable()
export class HierarchyService {
  constructor(@InjectModel('HierarchyNode') private readonly hierarchyModel: Model<any>) {}

  async findAllByOrgId(organizationId: string) {
    return this.hierarchyModel.find({ organizationId }).exec();
  }

  async createNode(organizationId: string, nodeData: Partial<HierarchyNode>) {
    const newNode = new this.hierarchyModel({
      ...nodeData,
      organizationId,
      status: nodeData.status || 'Active',
    });
    return newNode.save();
  }

  async updateNode(organizationId: string, id: string, updateData: Partial<HierarchyNode>) {
    const node = await this.hierarchyModel.findOneAndUpdate(
      { _id: id, organizationId },
      { $set: updateData },
      { new: true }
    ).exec();
    
    if (!node) {
      throw new NotFoundException('Hierarchy node not found');
    }
    
    return node;
  }

  async deleteNode(organizationId: string, id: string) {
    const node = await this.hierarchyModel.findOneAndDelete({ _id: id, organizationId }).exec();
    if (!node) {
      throw new NotFoundException('Hierarchy node not found');
    }
    return { deleted: true };
  }
}
