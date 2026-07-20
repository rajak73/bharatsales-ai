import { Controller, Get, Post, Patch, Body, Param, Request, UseGuards, UseInterceptors } from '@nestjs/common';
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

  @Post()
  @RequirePermissions(Resource.Visits, Action.Create)
  async createBeat(@Request() req: any, @Body() data: any) {
    return this.beatsService.createBeat(req.user.orgId, data);
  }

  @Patch(':id')
  @RequirePermissions(Resource.Visits, Action.Update)
  async updateBeat(@Request() req: any, @Param('id') id: string, @Body() data: any) {
    return this.beatsService.updateBeat(req.user.orgId, id, data);
  }

  @Post(':id/publish')
  @RequirePermissions(Resource.Visits, Action.Update)
  async publishBeat(@Request() req: any, @Param('id') id: string) {
    return this.beatsService.publishBeat(req.user.orgId, id);
  }
}
