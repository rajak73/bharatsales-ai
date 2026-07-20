import { Controller, Get, Post, Body, Query, UseGuards, Request } from '@nestjs/common';
import { SyncService } from './sync.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('sync')
@UseGuards(JwtAuthGuard)
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Get('pull')
  async pull(@Request() req: any, @Query('lastSyncTimestamp') lastSyncTimestamp?: string) {
    return this.syncService.pull(req.user.orgId, lastSyncTimestamp);
  }

  @Post('push')
  async push(@Request() req: any, @Body() payload: { orders?: any[], visits?: any[], collections?: any[] }) {
    return this.syncService.push(req.user.orgId, req.user.sub, payload);
  }
}
