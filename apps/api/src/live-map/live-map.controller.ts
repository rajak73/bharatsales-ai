import { Controller, Get, Sse, MessageEvent, UseGuards, Request, UseInterceptors } from '@nestjs/common';
import { LiveMapService } from './live-map.service';
import { Observable, interval } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { AuditEntity } from '../audit/audit.decorator';
import { Resource, Action } from '@bharatsales/permissions';
import { AuditInterceptor } from '../audit/audit.interceptor';

@Controller('live-map')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@AuditEntity('LiveMap')
@UseInterceptors(AuditInterceptor)
export class LiveMapController {
  constructor(private readonly liveMapService: LiveMapService) {}

@RequirePermissions(Resource.LiveMap, Action.Read)
  @Get('reps')
    async getLiveReps(@Request() req: any) {
    if (!req.user.orgId) return [];
    return this.liveMapService.getLiveReps(req.user.orgId);
  }

  @RequirePermissions(Resource.LiveMap, Action.Read)
  @Sse('stream')
    streamLiveReps(@Request() req: any): Observable<MessageEvent> {
    return interval(5000).pipe(
      switchMap(() => this.liveMapService.getLiveReps(req.user.orgId)),
      map(data => ({ data } as MessageEvent))
    );
  }
}
