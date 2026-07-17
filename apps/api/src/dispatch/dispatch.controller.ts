import { Controller, Get, Post, Patch, Param, Body, UseGuards, Request, Query } from '@nestjs/common';
import { DispatchService } from './dispatch.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('dispatch')
@UseGuards(JwtAuthGuard)
export class DispatchController {
  constructor(private readonly dispatchService: DispatchService) {}

  @Get()
  async getDispatches(@Request() req: any, @Query('organizationId') queryOrgId?: string) {
    const orgId = req.user.orgId || req.user.organizationId || queryOrgId;
    return this.dispatchService.getDispatches(orgId);
  }

  @Post()
  async createDispatch(@Request() req: any, @Body() data: any) {
    const orgId = req.user.orgId || req.user.organizationId;
    return this.dispatchService.create(orgId, data);
  }

  @Patch(':id/status')
  async updateStatus(@Request() req: any, @Param('id') id: string, @Body() data: { status: string }) {
    const orgId = req.user.orgId || req.user.organizationId;
    if (data.status === 'Delivered') {
      return this.dispatchService.markDelivered(orgId, id);
    }
    // Handle other statuses if needed, but the current service method is specifically `markDelivered`.
    throw new Error('Only Delivered status update is supported via this endpoint currently.');
  }
}
