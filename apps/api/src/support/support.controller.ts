import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { SupportService } from './support.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('support')
@UseGuards(JwtAuthGuard)
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post('tickets')
  async createTicket(@Request() req: any, @Body() data: { subject: string; message: string; priority?: string }) {
    return this.supportService.create(req.user.orgId, req.user.sub, data);
  }

  @Get('tickets')
  async getMyOrgTickets(@Request() req: any) {
    return this.supportService.findAllForOrg(req.user.orgId);
  }
}
