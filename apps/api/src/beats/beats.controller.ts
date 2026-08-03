import { Controller, Get, Post, Patch, Body, Param, Query, Request, UseGuards, UseInterceptors } from '@nestjs/common';
import { BeatsService } from './beats.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Action, Resource } from '@bharatsales/permissions';
import { RequirePermissions } from '../auth/permissions.decorator';
import { AuditInterceptor } from '../audit/audit.interceptor';
import { AuditEntity } from '../audit/audit.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';

@Controller('beats')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@AuditEntity('Beats')
@UseInterceptors(AuditInterceptor)
export class BeatsController {
  constructor(private readonly beatsService: BeatsService) {}

  @Get('today')
  @RequirePermissions(Resource.Visits, Action.Read)
  async getTodayBeat(@Request() req: any) {
    return this.beatsService.getTodayBeat(req.user.sub, req.user.orgId);
  }

  @Get('deviation')
  @RequirePermissions(Resource.LiveMap, Action.Read)
  async checkRouteDeviation(@Request() req: any, @Query('userId') userId: string, @Query('date') date?: string) {
    return this.beatsService.checkRouteDeviation(req.user.orgId, userId || req.user.sub, date);
  }

  @Get('team-today')
  @RequirePermissions(Resource.LiveMap, Action.Read)
  async getTeamBeatCompletion(@Request() req: any) {
    return this.beatsService.getTeamBeatCompletion(req.user.orgId, req.user.sub, req.user.role);
  }

  @Get()
  @RequirePermissions(Resource.Beats, Action.Read)
  async getAllBeats(@Request() req: any) {
    return this.beatsService.getAllBeats(req.user.orgId, { sub: req.user.sub, role: req.user.role });
  }

  @Post()
  @RequirePermissions(Resource.Beats, Action.Create)
  async createBeat(@Request() req: any, @Body() data: any) {
    return this.beatsService.createBeat(req.user.orgId, data);
  }

  @Patch(':id')
  @RequirePermissions(Resource.Beats, Action.Update)
  async updateBeat(@Request() req: any, @Param('id') id: string, @Body() data: any) {
    return this.beatsService.updateBeat(req.user.orgId, id, data);
  }

  @Post(':id/publish')
  @RequirePermissions(Resource.Beats, Action.Update)
  async publishBeat(@Request() req: any, @Param('id') id: string) {
    return this.beatsService.publishBeat(req.user.orgId, id);
  }

  // A Sales Manager (or Organization Admin) assigns an already-published
  // beat template to a specific rep for a specific date.
  @Post(':id/assign')
  @RequirePermissions(Resource.Beats, Action.Approve)
  async assignBeat(@Request() req: any, @Param('id') id: string, @Body() body: { userId: string; date: string }) {
    return this.beatsService.assignBeat(req.user.orgId, { sub: req.user.sub, role: req.user.role }, id, body.userId, body.date);
  }
}
