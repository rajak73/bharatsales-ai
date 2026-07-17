import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { CollectionsService } from './collections.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('collections')
@UseGuards(JwtAuthGuard)
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Get()
  async findAll(@Request() req: any) {
    return this.collectionsService.findAll(req.user.orgId);
  }

  @Post()
  async create(@Request() req: any, @Body() data: any) {
    return this.collectionsService.create(req.user.orgId, req.user.sub, data);
  }

  @Patch(':id/status')
  async updateStatus(
    @Request() req: any,
    @Param('id') id: string,
    @Body('status') status: 'Pending' | 'Cleared' | 'Bounced'
  ) {
    return this.collectionsService.updateStatus(req.user.orgId, id, status);
  }
}
