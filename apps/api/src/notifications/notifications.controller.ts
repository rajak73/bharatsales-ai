import { Controller, Request, Post, Body, UseGuards, Query, UseInterceptors } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { AuditEntity } from '../audit/audit.decorator';
import { Resource, Action } from '@bharatsales/permissions';
import { AuditInterceptor } from '../audit/audit.interceptor';

@Controller('notifications')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@AuditEntity('Users')
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

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
