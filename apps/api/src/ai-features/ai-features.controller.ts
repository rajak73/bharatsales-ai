import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AiFeaturesService } from './ai-features.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('api/v1/ai-features')
@UseGuards(JwtAuthGuard)
export class AiFeaturesController {
  constructor(private readonly aiFeaturesService: AiFeaturesService) {}

  @Get('insights')
  async getInsights(@Request() req: any) {
    return this.aiFeaturesService.generateInsights(req.user.organizationId);
  }

  @Get('recommendations/:outletId')
  async getRecommendations(@Request() req: any, @Param('outletId') outletId: string) {
    return this.aiFeaturesService.getRecommendations(outletId, req.user.organizationId);
  }

  @Post('parse-voice')
  async parseVoice(@Request() req: any, @Body() data: { transcription: string }) {
    if (!data.transcription) {
      return { items: [] };
    }
    return this.aiFeaturesService.parseVoiceToOrder(req.user.organizationId, data.transcription);
  }
}
