import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { TargetsService } from './targets.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('api/v1/targets')
@UseGuards(JwtAuthGuard)
export class TargetsController {
  constructor(private readonly targetsService: TargetsService) {}

  @Get()
  getTargets(@Request() req: any) {
    return this.targetsService.getTargets(req.user.organizationId);
  }

  @Post()
  createTarget(@Request() req: any, @Body() data: any) {
    return this.targetsService.createTarget({ ...data, organizationId: req.user.organizationId });
  }
}
