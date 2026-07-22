import { Controller, Get, Post, Put, Delete, Patch, Body, Param, UseGuards, Request, UseInterceptors } from '@nestjs/common';
import { CollectionsService } from './collections.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { AuditEntity } from '../audit/audit.decorator';
import { Resource, Action } from '@bharatsales/permissions';
import { AuditInterceptor } from '../audit/audit.interceptor';

@Controller('collections')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@AuditEntity('Collections')
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

@RequirePermissions(Resource.Collections, Action.Read)
  @Get()
  async findAll(@Request() req: any) {
    return this.collectionsService.findAll(req.user.orgId);
  }

@RequirePermissions(Resource.Collections, Action.Create)
  @Post()
  async create(@Request() req: any, @Body() data: any) {
    return this.collectionsService.create(req.user.orgId, req.user.sub, data);
  }

@RequirePermissions(Resource.Collections, Action.Update)
  @Patch(':id/status')
  async updateStatus(
    @Request() req: any,
    @Param('id') id: string,
    @Body('status') status: 'Pending' | 'Cleared' | 'Bounced'
  ) {
    return this.collectionsService.updateStatus(req.user.orgId, id, status);
  }

@RequirePermissions(Resource.Collections, Action.Update)
  @Put(':id')
  async updateCollection(@Request() req: any, @Param('id') id: string, @Body() data: any) {
    return this.collectionsService.update(req.user.orgId, id, data);
  }

@RequirePermissions(Resource.Collections, Action.Delete)
  @Delete(':id')
  async deleteCollection(@Request() req: any, @Param('id') id: string) {
    return this.collectionsService.remove(req.user.orgId, id);
  }
}
