import { Controller, Post, Get, Body, UseGuards, Request, Param, Res, NotFoundException, UseInterceptors } from '@nestjs/common';
import { ExportsService } from './exports.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { AuditEntity } from '../audit/audit.decorator';
import { Resource, Action } from '@bharatsales/permissions';
import { AuditInterceptor } from '../audit/audit.interceptor';
import { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';

@Controller('api/v1/exports')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@AuditEntity('Exports')
@UseInterceptors(AuditInterceptor)
export class ExportsController {
  constructor(private readonly exportsService: ExportsService) {}

  @RequirePermissions(Resource.Orders, Action.Read) // Assume Orders permission as proxy for generic export access
  @Post()
  requestExport(@Request() req: any, @Body() data: { entityType: string, filters: any }) {
    return this.exportsService.requestExport(req.user.orgId, req.user.sub, data.entityType, data.filters);
  }

  @RequirePermissions(Resource.Orders, Action.Read)
  @Get()
  getJobs(@Request() req: any) {
    return this.exportsService.getJobs(req.user.orgId, req.user.sub);
  }

  @RequirePermissions(Resource.Orders, Action.Read)
  @Get(':id')
  getJob(@Request() req: any, @Param('id') id: string) {
    return this.exportsService.getJob(req.user.orgId, id);
  }

  // Bypassing strict API auth here to allow signed URLs in production, 
  // but for local testing, we just check if it exists in the organization folder
  @Get('download/:orgId/:fileName')
  downloadExport(
    @Param('orgId') orgId: string, 
    @Param('fileName') fileName: string, 
    @Res() res: Response
  ) {
    // Basic path traversal prevention
    const sanitizedOrgId = path.basename(orgId);
    const sanitizedFileName = path.basename(fileName);
    
    const filePath = path.join(process.cwd(), 'uploads', 'exports', sanitizedOrgId, sanitizedFileName);
    
    if (fs.existsSync(filePath)) {
      return res.download(filePath);
    }
    throw new NotFoundException('Export file not found or expired');
  }
}
