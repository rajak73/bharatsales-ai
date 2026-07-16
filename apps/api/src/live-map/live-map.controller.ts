import { Controller, Get, Sse, MessageEvent, UseGuards, Request } from '@nestjs/common';
import { LiveMapService } from './live-map.service';
import { Observable, interval } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('live-map')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LiveMapController {
  constructor(private readonly liveMapService: LiveMapService) {}

  @Get('reps')
  @Roles('Super Admin', 'Company Admin', 'Area Manager')
  async getLiveReps(@Request() req: any) {
    if (!req.user.organizationId) return [];
    return this.liveMapService.getLiveReps(req.user.organizationId);
  }

  @Sse('stream')
  @Roles('Super Admin', 'Company Admin', 'Area Manager')
  streamLiveReps(@Request() req: any): Observable<MessageEvent> {
    return interval(5000).pipe(
      switchMap(() => this.liveMapService.getLiveReps(req.user.organizationId)),
      map(data => ({ data } as MessageEvent))
    );
  }
}
