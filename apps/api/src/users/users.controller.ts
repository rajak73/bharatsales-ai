import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, UseInterceptors } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { AuditInterceptor } from '../audit/audit.interceptor';
import { AuditEntity } from '../audit/audit.decorator';
import { User } from '@bharatsales/shared-types';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { Resource, Action } from '@bharatsales/permissions';

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditInterceptor)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

@RequirePermissions(Resource.Users, Action.Read)
  @Get()
  async getUsers(@Request() req: any) {
    const orgId = req.user.orgId;
    return this.usersService.findAllByOrgId(orgId);
  }

@RequirePermissions(Resource.Users, Action.Create)
  @Post()
    @AuditEntity('User')
  async createUser(@Request() req: any, @Body() userData: Partial<User> & { password?: string }) {
    const orgId = req.user.orgId;
    const actorRole = req.user.role;
    return this.usersService.createUser(orgId, actorRole, userData);
  }

@RequirePermissions(Resource.Users, Action.Update)
  @Put(':id')
    @AuditEntity('User')
  async updateUser(@Request() req: any, @Param('id') id: string, @Body() updateData: Partial<User> & { password?: string }) {
    const orgId = req.user.orgId;
    const actorRole = req.user.role;
    return this.usersService.updateUser(orgId, actorRole, id, updateData);
  }

@RequirePermissions(Resource.Users, Action.Delete)
  @Delete(':id')
    @AuditEntity('User')
  async deleteUser(@Request() req: any, @Param('id') id: string) {
    const orgId = req.user.orgId;
    return this.usersService.deleteUser(orgId, id);
  }

@RequirePermissions(Resource.Users, Action.Create)
  @Post('invites')
    @AuditEntity('User_Invite')
  async inviteUser(@Request() req: any, @Body() data: { email: string; role: string }) {
    const orgId = req.user.orgId;
    const actorRole = req.user.role;
    return this.usersService.inviteUser(orgId, actorRole, data.email, data.role);
  }
}
