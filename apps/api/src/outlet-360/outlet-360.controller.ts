import { Controller, Get, Param, Query, NotFoundException } from '@nestjs/common';
import { Outlet360Service } from './outlet-360.service';

@Controller('outlet-360')
export class Outlet360Controller {
  constructor(private readonly outlet360Service: Outlet360Service) {}

  @Get(':code')
  async getOutletDetails(@Param('code') code: string, @Query('organizationId') orgId: string) {
    const details = await this.outlet360Service.getOutletDetails(orgId, code);
    if (!details) {
      throw new NotFoundException('Outlet not found');
    }
    return details;
  }

  @Get(':code/orders')
  async getOutletOrders(@Param('code') code: string, @Query('organizationId') orgId: string) {
    return this.outlet360Service.getOutletOrders(orgId, code);
  }

  @Get(':code/visits')
  async getOutletVisits(@Param('code') code: string, @Query('organizationId') orgId: string) {
    return this.outlet360Service.getOutletVisits(orgId, code);
  }
}
