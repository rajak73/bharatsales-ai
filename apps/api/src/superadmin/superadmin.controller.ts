import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { SuperadminService } from './superadmin.service';
import { SupportService } from '../support/support.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Tenant } from '../schemas/tenant.schema';

@Controller('superadmin')
@UseGuards(JwtAuthGuard)
export class SuperadminController {
  constructor(
    private readonly superadminService: SuperadminService,
    private readonly supportService: SupportService,
  ) {}

  private checkSuperAdmin(req: any) {
    if (req.user.platformAdmin !== true) {
      throw new ForbiddenException('Only platform administrators can access this endpoint');
    }
  }

  @Get('dashboard')
  async getPlatformDashboard(@Request() req: any) {
    this.checkSuperAdmin(req);
    return this.superadminService.getPlatformDashboard();
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

  @Patch('tenants/:id/subscription')
  async updateSubscription(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { plan?: string; billingCycle?: string; subscriptionUsersLimit?: number }
  ) {
    this.checkSuperAdmin(req);
    return this.superadminService.updateSubscription(id, body);
  }

  @Post('tenants/:id/billing')
  async addBillingRecord(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { amount: string; plan: string; status?: string }
  ) {
    this.checkSuperAdmin(req);
    return this.superadminService.addBillingRecord(id, body);
  }

  @Get('users')
  async getAllUsers(@Request() req: any, @Query('role') role?: string, @Query('organizationId') organizationId?: string, @Query('status') status?: string) {
    this.checkSuperAdmin(req);
    return this.superadminService.getAllUsers({ role, organizationId, status });
  }

  @Get('analytics')
  async getPlatformAnalytics(@Request() req: any) {
    this.checkSuperAdmin(req);
    return this.superadminService.getPlatformAnalytics();
  }

  @Get('tickets')
  async getAllTickets(@Request() req: any) {
    this.checkSuperAdmin(req);
    return this.supportService.findAllGlobal();
  }

  @Patch('tickets/:id/status')
  async updateTicketStatus(@Request() req: any, @Param('id') id: string, @Body() body: { status: string }) {
    this.checkSuperAdmin(req);
    return this.supportService.updateStatus(id, body.status);
  }

  @Get('settings')
  async getPlatformSettings(@Request() req: any) {
    this.checkSuperAdmin(req);
    return this.superadminService.getPlatformSettings();
  }

  @Patch('settings')
  async updatePlatformSettings(@Request() req: any, @Body() body: any) {
    this.checkSuperAdmin(req);
    return this.superadminService.updatePlatformSettings(body);
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
