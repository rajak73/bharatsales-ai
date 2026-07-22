import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Request, UseInterceptors } from '@nestjs/common';
import { TargetsService } from './targets.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { AuditEntity } from '../audit/audit.decorator';
import { Resource, Action } from '@bharatsales/permissions';
import { AuditInterceptor } from '../audit/audit.interceptor';

@Controller('targets')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@AuditEntity('Targets')
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TargetsController {
  constructor(private readonly targetsService: TargetsService) {}

@RequirePermissions(Resource.Targets, Action.Read)
  @Get()
  getTargets(@Request() req: any) {
    return this.targetsService.getTargets(req.user.orgId);
  }

@RequirePermissions(Resource.Targets, Action.Create)
  @Post()
  createTarget(@Request() req: any, @Body() data: any) {
    return this.targetsService.createTarget(req.user.orgId, data);
  }

@RequirePermissions(Resource.Targets, Action.Update)
  @Put(':id')
  updateTarget(@Request() req: any, @Param('id') id: string, @Body() data: any) {
    return this.targetsService.updateTarget(req.user.orgId, id, data);
  }

@RequirePermissions(Resource.Targets, Action.Delete)
  @Delete(':id')
  deleteTarget(@Request() req: any, @Param('id') id: string) {
    return this.targetsService.deleteTarget(req.user.orgId, id);
  }
}
