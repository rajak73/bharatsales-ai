import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ReturnsService } from './returns.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { ReturnOrder as SharedReturnOrder } from '@bharatsales/shared-types';

@Controller('returns')
@UseGuards(JwtAuthGuard)
export class ReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  @Get()
  async getReturns(@Request() req: any) {
    return this.returnsService.getReturns(req.user.orgId);
  }

  @Post()
  async createReturn(
    @Request() req: any, 
    @Body() data: Omit<SharedReturnOrder, 'id' | 'createdAt' | 'updatedAt' | 'organizationId'>
  ) {
    return this.returnsService.create(req.user.orgId, data, req.user.sub);
  }
}
