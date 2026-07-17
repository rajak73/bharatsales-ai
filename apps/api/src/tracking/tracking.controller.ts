import { Controller, Post, Body, Request, UseGuards } from '@nestjs/common';
import { TrackingService } from './tracking.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';

@Controller('tracking')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Post('bulk')
  async bulkCreatePings(
    @Request() req: any,
    @Body() body: { pings: any[] }
  ) {
    return this.trackingService.bulkCreatePings(req.user.sub, req.user.orgId, body.pings);
  }
}
