import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('api/v1/attendance')
@UseGuards(JwtAuthGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('start')
  startDay(@Request() req: any, @Body() data: { lat: number; lng: number; accuracy: number; deviceTimestamp: string }) {
    return this.attendanceService.startDay(req.user.userId, req.user.organizationId, data);
  }

  @Post('end')
  endDay(@Request() req: any, @Body() data: { lat: number; lng: number; accuracy: number }) {
    return this.attendanceService.endDay(req.user.userId, data);
  }

  @Get('me')
  getCurrentSession(@Request() req: any) {
    return this.attendanceService.getCurrentSession(req.user.userId);
  }
}
