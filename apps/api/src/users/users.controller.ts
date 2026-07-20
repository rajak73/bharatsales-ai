import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, UseInterceptors } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AuditInterceptor } from '../audit/audit.interceptor';
import { AuditEntity } from '../audit/audit.decorator';
import { User } from '@bharatsales/shared-types';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async getUsers(@Request() req: any) {
    const orgId = req.user.orgId;
    return this.usersService.findAllByOrgId(orgId);
  }

  @Post()
  @Roles('Super Admin', 'Company Admin')
  @AuditEntity('User')
  async createUser(@Request() req: any, @Body() userData: Partial<User> & { password?: string }) {
    const orgId = req.user.orgId;
    const actorRole = req.user.role;
    return this.usersService.createUser(orgId, actorRole, userData);
  }

  @Put(':id')
  @Roles('Super Admin', 'Company Admin')
  @AuditEntity('User')
  async updateUser(@Request() req: any, @Param('id') id: string, @Body() updateData: Partial<User> & { password?: string }) {
    const orgId = req.user.orgId;
    const actorRole = req.user.role;
    return this.usersService.updateUser(orgId, actorRole, id, updateData);
  }

  @Delete(':id')
  @Roles('Super Admin', 'Company Admin')
  @AuditEntity('User')
  async deleteUser(@Request() req: any, @Param('id') id: string) {
    const orgId = req.user.orgId;
    return this.usersService.deleteUser(orgId, id);
  }

  @Post('invites')
  @Roles('Super Admin', 'Company Admin')
  @AuditEntity('User_Invite')
  async inviteUser(@Request() req: any, @Body() data: { email: string; role: string }) {
    const orgId = req.user.orgId;
    const actorRole = req.user.role;
    return this.usersService.inviteUser(orgId, actorRole, data.email, data.role);
  }
}
