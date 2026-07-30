import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { HierarchyNode } from '@bharatsales/shared-types';

@Injectable()
export class HierarchyService {
  constructor(
    @InjectModel('HierarchyNode') private readonly hierarchyModel: Model<any>,
    @InjectModel('User') private readonly userModel: Model<any>
  ) {}

  async getUserRole(userId: string) {
    const user = await this.userModel.findById(userId).exec();
    return { name: user?.role };
  }

  async getUserTerritories(userId: string) {
    const user = await this.userModel.findById(userId).exec();
    return user?.territoryIds || [];
  }

  async findAllByOrgId(organizationId: string) {
    return this.hierarchyModel.find({ organizationId }).exec();
  }

  async createNode(organizationId: string, nodeData: Partial<HierarchyNode>) {
    delete (nodeData as any).organizationId;
    delete (nodeData as any)._id;
    delete (nodeData as any).createdAt;
    delete (nodeData as any).updatedAt;
    
    if (nodeData.parentId) {
      const parent = await this.hierarchyModel.findOne({ _id: nodeData.parentId, organizationId }).exec();
      if (!parent) {
        throw new BadRequestException('Parent node not found');
      }
      const levels: Record<string, number> = { 'Zone': 1, 'Region': 2, 'Area': 3, 'Territory': 4 };
      if (nodeData.level && levels[nodeData.level as string] <= levels[parent.level as string]) {
        throw new BadRequestException(`Invalid depth: A ${nodeData.level} cannot be a child of a ${parent.level}`);
      }
    }

    const newNode = new this.hierarchyModel({
      ...nodeData,
      organizationId,
      status: nodeData.status || 'Active',
    });
    return newNode.save();
  }

  async updateNode(organizationId: string, id: string, updateData: Partial<HierarchyNode>) {
    delete (updateData as any).organizationId;
    delete (updateData as any)._id;
    delete (updateData as any).createdAt;
    delete (updateData as any).updatedAt;
    
    const thisNode = await this.hierarchyModel.findOne({ _id: id, organizationId }).exec();
    if (!thisNode) {
      throw new NotFoundException('Hierarchy node not found');
    }

    if (updateData.parentId && updateData.parentId.toString() !== thisNode.parentId?.toString()) {
      const targetParent = await this.hierarchyModel.findOne({ _id: updateData.parentId, organizationId }).exec();
      if (!targetParent) {
        throw new BadRequestException('Target parent node not found');
      }
      
      const levels: Record<string, number> = { 'Zone': 1, 'Region': 2, 'Area': 3, 'Territory': 4 };
      const newLevel = updateData.level || thisNode.level;
      if (levels[newLevel as string] <= levels[targetParent.level as string]) {
        throw new BadRequestException(`Invalid depth: A ${newLevel} cannot be a child of a ${targetParent.level}`);
      }

      // Cyclical Loop Prevention
      let currentParentId = targetParent._id.toString();
      while (currentParentId) {
        if (currentParentId === id) {
          throw new BadRequestException('Cyclical hierarchy loop detected');
        }
        const p = await this.hierarchyModel.findOne({ _id: currentParentId, organizationId }).exec();
        if (!p || !p.parentId) break;
        currentParentId = p.parentId.toString();
      }
    }

    const node = await this.hierarchyModel.findOneAndUpdate(
      { _id: id, organizationId },
      { $set: updateData },
      { new: true }
    ).exec();
    
    return node;
  }

  async deleteNode(organizationId: string, id: string) {
    const childrenCount = await this.hierarchyModel.countDocuments({ parentId: id, organizationId }).exec();
    if (childrenCount > 0) {
      throw new BadRequestException('Cannot delete node with assigned children. Reassign children first.');
    }

    const node = await this.hierarchyModel.findOneAndDelete({ _id: id, organizationId }).exec();
    if (!node) {
      throw new NotFoundException('Hierarchy node not found');
    }
    return { deleted: true };
  }

  // Resolves the Sales Representatives reporting (via territory) to a given
  // Sales Manager — derived from the territory tree since there's no direct
  // manager/reportsTo field on User.
  async getTeamUserIds(organizationId: string, managerUserId: string): Promise<string[]> {
    const managerTerritories = await this.getUserTerritories(managerUserId);
    if (!managerTerritories || managerTerritories.length === 0) return [];

    const descendantIds = await this.getDescendantTerritoryIds(organizationId, managerTerritories);
    if (descendantIds.length === 0) return [];

    const reps = await this.userModel.find({
      organizationId,
      role: 'Sales Representative',
      territoryIds: { $in: descendantIds }
    }).select('_id').exec();

    return reps.map((u: any) => u._id.toString());
  }

  async getDescendantTerritoryIds(organizationId: string, nodeIds: string[]): Promise<string[]> {
    if (!nodeIds || nodeIds.length === 0) return [];
    
    let currentIds = [...nodeIds];
    const allIds = new Set(currentIds);

    // Max depth is 4 (Zone -> Region -> Area -> Territory)
    for (let depth = 0; depth < 4; depth++) {
      if (currentIds.length === 0) break;
      const children = await this.hierarchyModel.find({ 
        organizationId, 
        parentId: { $in: currentIds } 
      }).exec();
      
      currentIds = children.map((c: any) => c._id.toString());
      currentIds.forEach(id => allIds.add(id));
    }
    
    return Array.from(allIds);
  }
}
