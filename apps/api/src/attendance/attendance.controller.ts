import { Controller, Post, Get, Body, UseGuards, Request, UseInterceptors } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { AuditEntity } from '../audit/audit.decorator';
import { Resource, Action } from '@bharatsales/permissions';
import { AuditInterceptor } from '../audit/audit.interceptor';

@Controller('attendance')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@AuditEntity('Attendance')
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

@RequirePermissions(Resource.Attendance, Action.Create)
  @Post('start')
  startDay(@Request() req: any, @Body() data: { lat: number; lng: number; accuracy: number; deviceTimestamp: string; isMock?: boolean }) {
    return this.attendanceService.startDay(req.user.sub, req.user.orgId, data);
  }

@RequirePermissions(Resource.Attendance, Action.Create)
  @Post('end')
  endDay(@Request() req: any, @Body() data: { lat: number; lng: number; accuracy: number }) {
    return this.attendanceService.endDay(req.user.sub, data);
  }

@RequirePermissions(Resource.Attendance, Action.Read)
  @Get('me')
  getCurrentSession(@Request() req: any) {
    return this.attendanceService.getCurrentSession(req.user.sub);
  }
}
