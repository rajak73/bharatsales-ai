import { UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt.guard";

import { Controller, Request, Get, Param, Query, NotFoundException, UseInterceptors } from '@nestjs/common';
import { Outlet360Service } from './outlet-360.service';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { AuditEntity } from '../audit/audit.decorator';
import { Resource, Action } from '@bharatsales/permissions';
import { AuditInterceptor } from '../audit/audit.interceptor';

@Controller('outlet-360')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@AuditEntity('Outlets')
@UseInterceptors(AuditInterceptor)
export class Outlet360Controller {
  constructor(private readonly outlet360Service: Outlet360Service) {}

@RequirePermissions(Resource.Outlets, Action.Read)
  @Get(':code')
  async getOutletDetails(@Request() req: any, @Param('code') code: string) {
    const details = await this.outlet360Service.getOutletDetails(req.user.orgId, code);
    if (!details) {
      throw new NotFoundException('Outlet not found');
    }
    return details;
  }

@RequirePermissions(Resource.Outlets, Action.Read)
  @Get(':code/orders')
  async getOutletOrders(@Request() req: any, @Param('code') code: string) {
    return this.outlet360Service.getOutletOrders(req.user.orgId, code);
  }

@RequirePermissions(Resource.Outlets, Action.Read)
  @Get(':code/visits')
  async getOutletVisits(@Request() req: any, @Param('code') code: string) {
    return this.outlet360Service.getOutletVisits(req.user.orgId, code);
  }
}
