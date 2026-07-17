import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AiFeaturesService } from './ai-features.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('ai-features')
@UseGuards(JwtAuthGuard)
export class AiFeaturesController {
  constructor(private readonly aiFeaturesService: AiFeaturesService) {}

  @Get('insights')
  async getInsights(@Request() req: any) {
    return this.aiFeaturesService.generateInsights(req.user.orgId);
  }

  @Get('recommendations/:outletId')
  async getRecommendations(@Request() req: any, @Param('outletId') outletId: string) {
    return this.aiFeaturesService.getRecommendations(outletId, req.user.orgId);
  }

  @Post('parse-voice')
  async parseVoice(@Request() req: any, @Body() data: { transcription: string }) {
    if (!data.transcription) {
      return { items: [] };
    }
    return this.aiFeaturesService.parseVoiceToOrder(req.user.orgId, data.transcription);
  }
}
