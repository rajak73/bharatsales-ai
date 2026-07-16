import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, UseInterceptors } from '@nestjs/common';
import { HierarchyService } from './hierarchy.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AuditInterceptor } from '../audit/audit.interceptor';
import { AuditEntity } from '../audit/audit.decorator';
import { HierarchyNode } from '@bharatsales/shared-types';

@Controller('hierarchy')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class HierarchyController {
  constructor(private readonly hierarchyService: HierarchyService) {}

  @Get()
  async getHierarchy(@Request() req: any) {
    const orgId = req.user.orgId;
    return this.hierarchyService.findAllByOrgId(orgId);
  }

  @Post()
  @Roles('Super Admin', 'Company Admin')
  @AuditEntity('HierarchyNode')
  async createNode(@Request() req: any, @Body() nodeData: Partial<HierarchyNode>) {
    const orgId = req.user.orgId;
    return this.hierarchyService.createNode(orgId, nodeData);
  }

  @Put(':id')
  @Roles('Super Admin', 'Company Admin')
  @AuditEntity('HierarchyNode')
  async updateNode(@Request() req: any, @Param('id') id: string, @Body() updateData: Partial<HierarchyNode>) {
    const orgId = req.user.orgId;
    return this.hierarchyService.updateNode(orgId, id, updateData);
  }

  @Delete(':id')
  @Roles('Super Admin', 'Company Admin')
  @AuditEntity('HierarchyNode')
  async deleteNode(@Request() req: any, @Param('id') id: string) {
    const orgId = req.user.orgId;
    return this.hierarchyService.deleteNode(orgId, id);
  }
}
