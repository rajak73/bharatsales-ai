import { Controller, Post, Get, Body, Request, UseGuards, UseInterceptors } from '@nestjs/common';
import { ImportsService } from './imports.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AuditInterceptor } from '../audit/audit.interceptor';
import { AuditEntity } from '../audit/audit.decorator';

@Controller('imports')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class ImportsController {
  constructor(private readonly importsService: ImportsService) {}

  @Get('history')
  @Roles('SuperAdmin', 'CompanyAdmin')
  async getHistory(@Request() req: any) {
    return this.importsService.getImportHistory(req.user.orgId);
  }

  @Get('types')
  @Roles('SuperAdmin', 'CompanyAdmin')
  async getTypes(@Request() req: any) {
    return this.importsService.getImportTypes(req.user.orgId);
  }

  @Post('upload')
  @Roles('SuperAdmin', 'CompanyAdmin')
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

