import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { VisitsService } from './visits.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('api/v1/visits')
@UseGuards(JwtAuthGuard)
export class VisitsController {
  constructor(private readonly visitsService: VisitsService) {}

  @Post('check-in')
  checkIn(@Request() req: any, @Body() data: { outletId: string; lat: number; lng: number; accuracy: number }) {
    return this.visitsService.checkIn(req.user.userId, req.user.organizationId, data);
  }

  @Post('check-out')
  checkOut(@Request() req: any, @Body() data: { visitId: string }) {
    return this.visitsService.checkOut(req.user.userId, data.visitId);
  }
}
