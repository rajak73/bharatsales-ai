import { Controller, Get, Post, Patch, Param, Body, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { SuperadminService } from './superadmin.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Tenant } from '../schemas/tenant.schema';

@Controller('api/v1/superadmin')
@UseGuards(JwtAuthGuard)
export class SuperadminController {
  constructor(private readonly superadminService: SuperadminService) {}

  private checkSuperAdmin(req: any) {
    if (req.user.role !== 'Super Admin') {
      throw new ForbiddenException('Only Super Admins can access this endpoint');
    }
  }

  @Get('tenants')
  async getAllTenants(@Request() req: any) {
    this.checkSuperAdmin(req);
    return this.superadminService.getAllTenants();
  }

  @Patch('tenants/:id/status')
  async updateTenantStatus(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { status: string }
  ) {
    this.checkSuperAdmin(req);
    return this.superadminService.updateTenantStatus(id, body.status);
  }

  @Post('tenants')
  async createTenant(@Request() req: any, @Body() body: Partial<Tenant>) {
    this.checkSuperAdmin(req);
    return this.superadminService.createTenant(body);
  }

  @Get('audit')
  async getGlobalAuditLogs(@Request() req: any) {
    this.checkSuperAdmin(req);
    return this.superadminService.getGlobalAuditLogs();
  }

  @Get('metrics')
  async getMetrics(@Request() req: any) {
    this.checkSuperAdmin(req);
    return this.superadminService.getMetrics();
  }
}
