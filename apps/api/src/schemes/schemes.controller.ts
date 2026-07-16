import { Controller, Get, Post, Put, Param, Body, UseGuards, Request } from '@nestjs/common';
import { SchemesService } from './schemes.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Scheme as SharedScheme } from '@bharatsales/shared-types';

@Controller('schemes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SchemesController {
  constructor(private readonly schemesService: SchemesService) {}

  @Get()
  async getAllSchemes(@Request() req: any) {
    return this.schemesService.findAll(req.user.organizationId);
  }

  @Get('active')
  async getActiveSchemes(@Request() req: any) {
    return this.schemesService.getActiveSchemes(req.user.organizationId);
  }

  @Post()
  @Roles('Super Admin', 'Company Admin', 'Area Manager')
  async createScheme(
    @Request() req: any, 
    @Body() data: Omit<SharedScheme, 'id' | 'createdAt' | 'updatedAt' | 'organizationId'>
  ) {
    return this.schemesService.create(req.user.organizationId, data);
  }

  @Put(':id/deactivate')
  @Roles('Super Admin', 'Company Admin', 'Area Manager')
  async deactivateScheme(@Request() req: any, @Param('id') schemeId: string) {
    return this.schemesService.deactivate(req.user.organizationId, schemeId);
  }
}
