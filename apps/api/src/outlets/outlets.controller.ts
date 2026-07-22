import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, UseInterceptors, Request } from '@nestjs/common';
import { OutletsService } from './outlets.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { Action, Resource } from '@bharatsales/permissions';
import { AuditInterceptor } from '../audit/audit.interceptor';
import { AuditEntity } from '../audit/audit.decorator';
import { Outlet } from '@bharatsales/shared-types';

@Controller('outlets')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditInterceptor)
export class OutletsController {
  constructor(private readonly outletsService: OutletsService) {}

  @RequirePermissions(Resource.Outlets, Action.Read)
  @Get()
  async getOutlets(@Request() req: any) {
    // The orgId is injected into req.user by the JwtAuthGuard
    const orgId = req.user.orgId;
    return this.outletsService.findAllByOrgId(orgId);
  }

  @Get(':id/360')
  @RequirePermissions(Resource.Outlets, Action.Read)
  @AuditEntity('Outlet_360_View')
  async getOutlet360(@Request() req: any, @Param('id') id: string) {
    const orgId = req.user.orgId;
    return this.outletsService.getOutlet360(orgId, id);
  }

  @Get('export')
  @RequirePermissions(Resource.Outlets, Action.Read)
  @AuditEntity('Export_Outlets')
  async exportOutlets(@Request() req: any) {
    // BR-017: Explicitly intercepting this via AuditInterceptor
    // Note: The interceptor only logs mutations (POST, PUT, DELETE) by default.
    // However, since it explicitly requests export, we can assume the business requirement needs it.
    // In our interceptor we only allow POST/PATCH/PUT/DELETE. We can use POST for export to trigger the interceptor.
    throw new Error('Please use POST /export for auditing purposes');
  }

  @Post('export')
  @RequirePermissions(Resource.Outlets, Action.Read)
  @AuditEntity('Export_Outlets')
  async exportOutletsPost(@Request() req: any) {
    const orgId = req.user.orgId;
    const data = await this.outletsService.findAllByOrgId(orgId);
    return { exportedRecords: data.length, data };
  }

  @Post()
  @RequirePermissions(Resource.Outlets, Action.Create)
  @AuditEntity('Outlet')
  async createOutlet(@Request() req: any, @Body() outletData: Omit<Outlet, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>) {
    const orgId = req.user.orgId;
    return this.outletsService.create(orgId, outletData);
  }

  @Delete(':id')
  @RequirePermissions(Resource.Outlets, Action.Delete)
  @AuditEntity('Outlet')
  async deleteOutlet(@Request() req: any, @Param('id') id: string) {
    const orgId = req.user.orgId;
    return this.outletsService.softDelete(orgId, id);
  }

  @Patch(':id')
  @RequirePermissions(Resource.Outlets, Action.Update)
  @AuditEntity('Outlet')
  async updateOutlet(@Request() req: any, @Param('id') id: string, @Body() data: any) {
    const orgId = req.user.orgId;
    return this.outletsService.update(orgId, id, data);
  }

  @Post(':id/approve')
  @RequirePermissions(Resource.Outlets, Action.Update)
  @AuditEntity('Outlet_Approval')
  async approveOutlet(@Request() req: any, @Param('id') id: string) {
    const orgId = req.user.orgId;
    return this.outletsService.approve(orgId, id);
  }
}
