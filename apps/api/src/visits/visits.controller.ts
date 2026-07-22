import { Controller, Post, Body, Param, UseGuards, Request, UseInterceptors } from '@nestjs/common';
import { VisitsService } from './visits.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { AuditEntity } from '../audit/audit.decorator';
import { Resource, Action } from '@bharatsales/permissions';
import { AuditInterceptor } from '../audit/audit.interceptor';

@Controller('visits')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@AuditEntity('Visits')
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class VisitsController {
  constructor(private readonly visitsService: VisitsService) {}

@RequirePermissions(Resource.Visits, Action.Create)
  @Post('check-in')
  checkIn(@Request() req: any, @Body() data: { outletId: string; lat: number; lng: number; accuracy: number }) {
    return this.visitsService.checkIn(req.user.sub, req.user.orgId, data);
  }

@RequirePermissions(Resource.Visits, Action.Create)
  @Post(':id/check-out')
  checkOut(@Request() req: any, @Param('id') visitId: string) {
    return this.visitsService.checkOut(req.user.sub, visitId);
  }

@RequirePermissions(Resource.Visits, Action.Create)
  @Post(':id/activities')
  addActivity(@Request() req: any, @Param('id') visitId: string, @Body() data: any) {
    return this.visitsService.addActivity(req.user.sub, visitId, data);
  }
}
