import { Controller, Get, Post, Param, Body, UseGuards, Request, UseInterceptors } from '@nestjs/common';
import { DispatchService } from './dispatch.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { AuditEntity } from '../audit/audit.decorator';
import { Resource, Action } from '@bharatsales/permissions';
import { AuditInterceptor } from '../audit/audit.interceptor';

@Controller('dispatches')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@AuditEntity('Dispatch')
@UseInterceptors(AuditInterceptor)
export class DispatchController {
  constructor(private readonly dispatchService: DispatchService) {}

  @RequirePermissions(Resource.Dispatch, Action.Read)
  @Get()
  async findAll(@Request() req: any) {
    return this.dispatchService.findAll(req.user.orgId, req.user);
  }

  @RequirePermissions(Resource.Dispatch, Action.Create)
  @Post()
  async create(@Request() req: any, @Body() data: { orderId: string; vehicle: string; driver: string }) {
    return this.dispatchService.createDispatch(req.user.orgId, data.orderId, req.user.sub, data, req.user);
  }

  @RequirePermissions(Resource.Dispatch, Action.Update)
  @Post(':id/deliver')
  async confirmDelivery(
    @Request() req: any,
    @Param('id') id: string,
    @Body() data: { items: { productId: string; deliveredQty: number; damagedQty?: number; reason?: string; evidence?: string[] }[] }
  ) {
    return this.dispatchService.confirmDelivery(req.user.orgId, id, req.user.sub, data.items, req.user);
  }
}
