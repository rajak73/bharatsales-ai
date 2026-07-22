import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, UseInterceptors } from '@nestjs/common';
import { HierarchyService } from './hierarchy.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { AuditInterceptor } from '../audit/audit.interceptor';
import { AuditEntity } from '../audit/audit.decorator';
import { HierarchyNode } from '@bharatsales/shared-types';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { Resource, Action } from '@bharatsales/permissions';

@Controller('hierarchy')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditInterceptor)
export class HierarchyController {
  constructor(private readonly hierarchyService: HierarchyService) {}

@RequirePermissions(Resource.Users, Action.Read)
  @Get()
  async getHierarchy(@Request() req: any) {
    const orgId = req.user.orgId;
    return this.hierarchyService.findAllByOrgId(orgId);
  }

@RequirePermissions(Resource.Users, Action.Create)
  @Post()
    @AuditEntity('HierarchyNode')
  async createNode(@Request() req: any, @Body() nodeData: Partial<HierarchyNode>) {
    const orgId = req.user.orgId;
    return this.hierarchyService.createNode(orgId, nodeData);
  }

@RequirePermissions(Resource.Users, Action.Update)
  @Put(':id')
    @AuditEntity('HierarchyNode')
  async updateNode(@Request() req: any, @Param('id') id: string, @Body() updateData: Partial<HierarchyNode>) {
    const orgId = req.user.orgId;
    return this.hierarchyService.updateNode(orgId, id, updateData);
  }

@RequirePermissions(Resource.Users, Action.Delete)
  @Delete(':id')
    @AuditEntity('HierarchyNode')
  async deleteNode(@Request() req: any, @Param('id') id: string) {
    const orgId = req.user.orgId;
    return this.hierarchyService.deleteNode(orgId, id);
  }
}
