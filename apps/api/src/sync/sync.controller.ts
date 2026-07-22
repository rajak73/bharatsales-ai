import { Controller, Get, Post, Body, Query, UseGuards, Request, UseInterceptors } from '@nestjs/common';
import { SyncService } from './sync.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { AuditEntity } from '../audit/audit.decorator';
import { Resource, Action } from '@bharatsales/permissions';
import { AuditInterceptor } from '../audit/audit.interceptor';

@Controller('sync')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@AuditEntity('Visits')
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

@RequirePermissions(Resource.Visits, Action.Read)
  @Get('pull')
  async pull(@Request() req: any, @Query('lastSyncTimestamp') lastSyncTimestamp?: string) {
    return this.syncService.pull(req.user.orgId, lastSyncTimestamp);
  }

@RequirePermissions(Resource.Visits, Action.Create)
  @Post('push')
  async push(@Request() req: any, @Body() payload: { orders?: any[], visits?: any[], collections?: any[] }) {
    return this.syncService.push(req.user.orgId, req.user.sub, payload);
  }
}
