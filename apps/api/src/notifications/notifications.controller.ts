import { Controller, Request, Post, Body, UseGuards, Query, UseInterceptors, Get, Put, Param } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { AuditEntity } from '../audit/audit.decorator';
import { Resource, Action } from '@bharatsales/permissions';
import { AuditInterceptor } from '../audit/audit.interceptor';

@Controller('notifications')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@AuditEntity('Notifications')
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(@Request() req: any) {
    return this.notificationsService.getNotifications(req.user.orgId, req.user.userId);
  }

  @Put(':id/read')
  async markAsRead(@Request() req: any, @Param('id') id: string) {
    return this.notificationsService.markAsRead(req.user.orgId, req.user.userId, id);
  }

  @Put('read-all')
  async markAllAsRead(@Request() req: any) {
    return this.notificationsService.markAllAsRead(req.user.orgId, req.user.userId);
  }

  @RequirePermissions(Resource.Users, Action.Create)
  @Post('sms')
  async sendSms(@Request() req: any, @Body() body: { to: string; message: string }) {
    return this.notificationsService.sendSms(req.user.orgId, body.to, body.message);
  }

@RequirePermissions(Resource.Users, Action.Create)
  @Post('whatsapp')
  async sendWhatsApp(@Request() req: any, @Body() body: { to: string; templateId: string; payload: any }) {
    return this.notificationsService.sendWhatsApp(req.user.orgId, body.to, body.templateId, body.payload);
  }
}
