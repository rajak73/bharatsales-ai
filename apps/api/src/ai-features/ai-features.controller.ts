import { RequirePermissions } from "../auth/permissions.decorator";

import { Controller, Get, Post, Body, Param, UseGuards, Request, UseInterceptors } from '@nestjs/common';
import { AiFeaturesService } from './ai-features.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { AuditEntity } from '../audit/audit.decorator';
import { AuditInterceptor } from '../audit/audit.interceptor';
import { Resource, Action } from '@bharatsales/permissions';

@Controller('ai-features')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@AuditEntity('Analytics')
@UseInterceptors(AuditInterceptor)
export class AiFeaturesController {
  constructor(private readonly aiFeaturesService: AiFeaturesService) {}

  @RequirePermissions(Resource.Analytics, Action.Read)
  @Get('insights')
  async getInsights(@Request() req: any) {
    return this.aiFeaturesService.generateInsights(req.user.orgId);
  }

  @RequirePermissions(Resource.Analytics, Action.Read)
  @Get('recommendations/:outletId')
  async getRecommendations(@Request() req: any, @Param('outletId') outletId: string) {
    return this.aiFeaturesService.getRecommendations(outletId, req.user.orgId);
  }

  @RequirePermissions(Resource.Analytics, Action.Create)
  @Post('parse-voice')
  async parseVoice(@Request() req: any, @Body() data: { transcription: string }) {
    if (!data.transcription) {
      return { items: [] };
    }
    return this.aiFeaturesService.parseVoiceToOrder(req.user.orgId, data.transcription);
  }
}
