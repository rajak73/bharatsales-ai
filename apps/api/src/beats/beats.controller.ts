import { Controller, Get, Request, UseGuards, UseInterceptors } from '@nestjs/common';
import { BeatsService } from './beats.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Action, Resource } from '@bharatsales/permissions';
import { RequirePermissions } from '../auth/permissions.decorator';
import { AuditInterceptor } from '../audit/audit.interceptor';
import { AuditEntity } from '../audit/audit.decorator';

@Controller('beats')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class BeatsController {
  constructor(private readonly beatsService: BeatsService) {}

  @Get('today')
  @RequirePermissions(Resource.Visits, Action.Read)
  async getTodayBeat(@Request() req: any) {
    return this.beatsService.getTodayBeat(req.user.sub, req.user.orgId);
  }

  @Get()
  @RequirePermissions(Resource.Visits, Action.Read)
  async getAllBeats(@Request() req: any) {
    return this.beatsService.getAllBeats(req.user.orgId);
  }
}
