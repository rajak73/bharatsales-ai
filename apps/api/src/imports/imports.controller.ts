import { Controller, Post, Get, Body, Request, UseGuards, UseInterceptors } from '@nestjs/common';
import { ImportsService } from './imports.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { AuditInterceptor } from '../audit/audit.interceptor';
import { AuditEntity } from '../audit/audit.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { Resource, Action } from '@bharatsales/permissions';

@Controller('imports')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditInterceptor)
export class ImportsController {
  constructor(private readonly importsService: ImportsService) {}

@RequirePermissions(Resource.Imports, Action.Read)
  @Get('history')
    async getHistory(@Request() req: any) {
    return this.importsService.getImportHistory(req.user.orgId);
  }

@RequirePermissions(Resource.Imports, Action.Read)
  @Get('types')
    async getTypes(@Request() req: any) {
    return this.importsService.getImportTypes(req.user.orgId);
  }

@RequirePermissions(Resource.Imports, Action.Create)
  @Post('upload')
    @AuditEntity('Import')
  async uploadData(
    @Request() req: any,
    @Body() body: { type: string; fileBase64: string }
  ) {
    const orgId = req.user.orgId;
    const fileBuffer = Buffer.from(body.fileBase64, 'base64');
    return this.importsService.uploadData(orgId, body.type, fileBuffer);
  }
}

