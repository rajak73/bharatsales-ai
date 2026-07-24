import { Controller, Get, Post, Put, Delete, Patch, Param, Body, UseGuards, Request, Query, UseInterceptors } from '@nestjs/common';
import { DispatchService } from './dispatch.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { AuditEntity } from '../audit/audit.decorator';
import { Resource, Action } from '@bharatsales/permissions';
import { AuditInterceptor } from '../audit/audit.interceptor';

@Controller('dispatch')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@AuditEntity('Dispatch')
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DispatchController {
  constructor(private readonly dispatchService: DispatchService) {}

@RequirePermissions(Resource.Dispatch, Action.Read)
  @Get()
  async getDispatches(@Request() req: any) {
    const orgId = req.user.orgId;
    return this.dispatchService.getDispatches(orgId);
  }

@RequirePermissions(Resource.Dispatch, Action.Create)
  @Post()
  async createDispatch(@Request() req: any, @Body() data: any) {
    const orgId = req.user.orgId || req.user.orgId;
    return this.dispatchService.create(orgId, data);
  }

@RequirePermissions(Resource.Dispatch, Action.Update)
  @Patch(':id/status')
  async updateStatus(@Request() req: any, @Param('id') id: string, @Body() data: { status: string, deliveredItems?: any[], globalDamagedQty?: number, globalShortQty?: number }) {
    const orgId = req.user.orgId || req.user.orgId;
    if (data.status === 'Delivered' || data.status === 'Partial_Delivery' || data.status === 'Damaged_Delivery' || data.status === 'Refused' || data.status === 'Partial Delivery' || data.status === 'Damaged Delivery') {
      return this.dispatchService.markDelivered(orgId, id, req.user.id, data.deliveredItems, data.globalDamagedQty, data.globalShortQty);
    }
    // Handle other statuses if needed, but the current service method is specifically `markDelivered`.
    throw new Error('Only Delivered status update is supported via this endpoint currently.');
  }

@RequirePermissions(Resource.Dispatch, Action.Update)
  @Put(':id')
  async updateDispatch(@Request() req: any, @Param('id') id: string, @Body() data: any) {
    return this.dispatchService.update(req.user.orgId, id, data);
  }

@RequirePermissions(Resource.Dispatch, Action.Delete)
  @Delete(':id')
  async deleteDispatch(@Request() req: any, @Param('id') id: string) {
    return this.dispatchService.remove(req.user.orgId, id);
  }
}
