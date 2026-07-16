import { Controller, Post, Body, UseGuards, Query } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('sms')
  async sendSms(@Query('organizationId') organizationId: string, @Body() body: { to: string; message: string }) {
    return this.notificationsService.sendSms(organizationId, body.to, body.message);
  }

  @Post('whatsapp')
  async sendWhatsApp(@Query('organizationId') organizationId: string, @Body() body: { to: string; templateId: string; payload: any }) {
    return this.notificationsService.sendWhatsApp(organizationId, body.to, body.templateId, body.payload);
  }
}
