import { Controller, Post, Get, Body, Request, UseGuards, UseInterceptors } from '@nestjs/common';
import { TrackingService } from './tracking.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { AuditEntity } from '../audit/audit.decorator';
import { Resource, Action } from '@bharatsales/permissions';
import { AuditInterceptor } from '../audit/audit.interceptor';

@Controller('tracking')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@AuditEntity('Attendance')
@UseInterceptors(AuditInterceptor)
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

@RequirePermissions(Resource.Attendance, Action.Create)
  @Post('bulk')
  async bulkCreatePings(
    @Request() req: any,
    @Body() body: { pings: any[] }
  ) {
    return this.trackingService.bulkCreatePings(req.user.sub, req.user.orgId, body.pings);
  }

@RequirePermissions(Resource.Attendance, Action.Read)
  @Get()
  async getLatestPings(@Request() req: any) {
    return this.trackingService.getLatestPings(req.user.orgId);
  }
}
