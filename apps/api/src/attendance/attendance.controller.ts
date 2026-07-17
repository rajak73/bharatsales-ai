import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('attendance')
@UseGuards(JwtAuthGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('start')
  startDay(@Request() req: any, @Body() data: { lat: number; lng: number; accuracy: number; deviceTimestamp: string }) {
    return this.attendanceService.startDay(req.user.sub, req.user.orgId, data);
  }

  @Post('end')
  endDay(@Request() req: any, @Body() data: { lat: number; lng: number; accuracy: number }) {
    return this.attendanceService.endDay(req.user.sub, data);
  }

  @Get('me')
  getCurrentSession(@Request() req: any) {
    return this.attendanceService.getCurrentSession(req.user.sub);
  }
}
