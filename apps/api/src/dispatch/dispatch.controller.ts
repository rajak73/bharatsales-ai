import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DispatchService } from './dispatch.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('dispatch')
@UseGuards(JwtAuthGuard)
export class DispatchController {
  constructor(private readonly dispatchService: DispatchService) {}

  @Get()
  async getDispatches(@Query('organizationId') organizationId: string) {
    return this.dispatchService.getDispatches(organizationId);
  }
}
