import { NotFoundException, BadRequestException, ForbiddenException } from '../core/http-errors';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { User } from '@bharatsales/shared-types';
import { Tenant } from '../schemas/tenant.schema';
import { HierarchyService } from '../hierarchy/hierarchy.service';
import { isTestRuntime } from '../core/runtime';
import { emailLookup } from '../core/validation';
import { BrevoEmailProvider, renderEmailHtml } from '../common/email.provider';

// Fields a caller may ever set on a user through POST /users or PUT /users/:id.
// Everything else (platformAdmin, organizationId, emailVerified,
// failedLoginAttempts, lockedUntil, pushToken, _id, timestamps, and
// distributorId except in the explicit case handled in createUser) is dropped.
const WRITABLE_USER_FIELDS = ['email', 'name', 'password', 'role', 'mobile', 'status', 'territoryIds'] as const;

function pickWritableUserFields(data: any): Record<string, any> {
  const out: Record<string, any> = {};
  if (!data || typeof data !== 'object') return out;
  for (const key of WRITABLE_USER_FIELDS) {
    if (data[key] !== undefined) out[key] = data[key];
  }
  return out;
}

export class UsersService {
  constructor(
    private readonly userModel: Model<any>,
    private readonly tokenModel: Model<any>,
    private readonly tenantModel: Model<Tenant>,
    private readonly hierarchyService: HierarchyService,
    private readonly emailProvider: BrevoEmailProvider
  ) {}

  async findAllByOrgId(organizationId: string, user?: any) {
    // Super Admin is a platform-level operator, not a member of any single
    // org — the seed/provisioning flow still has to stamp some
    // organizationId on their user doc to satisfy the schema's required
    // field, which would otherwise leak them into every org's team list.
    const query: any = { organizationId, role: { $ne: 'Super Admin' } };
    if (user && user.role === 'Distributor') {
      // A Distributor only manages their own staff, not the whole org's users.
      query.distributorId = user.distributorId || '__none__';
    } else if (user && user.role === 'Sales Manager') {
      // A Sales Manager only sees the reps on their own team, not the whole org.
      // An empty team (manager with no territory, or no reps under it) must
      // yield an empty list — not a '__none__' sentinel, which Mongoose
      // cannot cast to an ObjectId and would 400 with "Invalid _id".
      const teamUserIds = await this.hierarchyService.getTeamUserIds(organizationId, user.sub);
      if (teamUserIds.length === 0) return [];
      query._id = { $in: teamUserIds };
    }
    return this.userModel.find(query).select('-password').exec();
  }

  // Role-hierarchy rules shared by createUser and inviteUser: who may create
  // (or invite) a user with a given role.
  private assertCanAssignRoleOnCreate(actorRole: string, role: string | undefined) {
    if (role === 'Super Admin' && actorRole !== 'Super Admin') {
      throw new ForbiddenException('Only Super Admins can create other Super Admins.');
    }
    if (role === 'Organization Admin' && !['Organization Admin', 'Super Admin'].includes(actorRole)) {
      throw new ForbiddenException('Only Organization Admins can create other Organization Admins.');
    }
    if (actorRole === 'Distributor' && role && role !== 'Distributor') {
      throw new ForbiddenException('Distributors can only create staff with the Distributor role.');
    }
  }

  async createUser(organizationId: string, actorRole: string, rawUserData: Partial<User> & { password?: string; distributorId?: string }, actorDistributorId?: string) {
    // Whitelist: never mass-assign privileged fields from the request body.
    const userData: any = pickWritableUserFields(rawUserData);

    this.assertCanAssignRoleOnCreate(actorRole, userData.role);

    if (actorRole === 'Distributor') {
      // A Distributor-created user is scoped to that same distributor's staff.
      userData.distributorId = actorDistributorId;
    } else if (
      actorRole === 'Organization Admin' &&
      userData.role === 'Distributor' &&
      typeof (rawUserData as any)?.distributorId === 'string' &&
      (rawUserData as any).distributorId
    ) {
      // The one legitimate way to set distributorId from a body: an Org Admin
      // explicitly provisioning a Distributor-role account for a distributor.
      userData.distributorId = (rawUserData as any).distributorId;
    }

    if (!userData.email) {
      throw new BadRequestException('Email is required');
    }

    // No more silent default password — a directly created user must be
    // given one; otherwise use the invitation flow (POST /users/invites).
    if (!userData.password) {
      throw new BadRequestException('Password is required. Use the invitation flow to add a user without a password.');
    }
    
    // Check if user exists
    const existing = await this.userModel.findOne(emailLookup(String(userData.email))).exec();
    if (existing) {
      throw new BadRequestException('Email already exists');
    }

    // Tier limit validation
    const tenant = await this.tenantModel.findById(organizationId).exec();
    if (tenant) {
      const maxUsers = (tenant as any).subscriptionUsersLimit || 0;
      const currentUserCount = await this.userModel.countDocuments({ organizationId, role: { $ne: 'Super Admin' } }).exec();
      if (maxUsers > 0 && currentUserCount >= maxUsers) {
        throw new BadRequestException(`Organization has reached its maximum user limit of ${maxUsers}. Please upgrade your plan.`);
      }
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const newUser = new this.userModel({
      ...userData,
      password: hashedPassword,
      organizationId,
      status: userData.status || 'Active',
    });
    
    const saved = await newUser.save();
    const result = saved.toObject();
    delete result.password;
    return result;
  }

  async inviteUser(organizationId: string, actorRole: string, email: string, role: string, name?: string, territoryIds?: string[], actorDistributorId?: string, mobile?: string) {
    if (role === 'Super Admin' && actorRole !== 'Super Admin') {
      throw new ForbiddenException('Only Super Admins can invite other Super Admins.');
    }
    // Same role-hierarchy rules as createUser (e.g. a Distributor or Sales
    // Rep can never invite an Organization Admin).
    this.assertCanAssignRoleOnCreate(actorRole, role);

    if (!email) {
      throw new BadRequestException('Email is required');
    }

    const existing = await this.userModel.findOne(emailLookup(email)).exec();
    if (existing) {
      throw new BadRequestException('Email already exists in the system');
    }

    // Tier limit validation
    const tenant = await this.tenantModel.findById(organizationId).exec();
    if (tenant) {
      const maxUsers = (tenant as any).subscriptionUsersLimit || 0;
      const currentUserCount = await this.userModel.countDocuments({ organizationId, role: { $ne: 'Super Admin' } }).exec();
      if (maxUsers > 0 && currentUserCount >= maxUsers) {
        throw new BadRequestException(`Organization has reached its maximum user limit of ${maxUsers}. Please upgrade your plan.`);
      }
    }

    // Creating a user in "Invited" status with a random, never-communicated
    // password — they set their real one via the invitation email link.
    const randomPassword = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);
    const newUserData: any = {
      email,
      role,
      name: name || 'Invited User',
      territoryIds: territoryIds || [],
      password: randomPassword,
      organizationId,
      status: 'Invited'
    };
    if (mobile) newUserData.mobile = String(mobile);
    // A Distributor-invited user is scoped to that same distributor's staff.
    if (actorRole === 'Distributor') {
      newUserData.distributorId = actorDistributorId;
    }
    const newUser = new this.userModel(newUserData);

    const saved = await newUser.save();
    
    // Generate INVITATION token
    const inviteToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 72); // 72 hours expiry
    
    const token = new this.tokenModel({
      userId: saved._id.toString(),
      token: inviteToken,
      type: 'INVITATION',
      expiresAt,
      used: false
    });
    await token.save();

    const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:6003'}/invite?token=${inviteToken}`;
    await this.emailProvider.sendEmail(
      email,
      "You've been invited to BharatSales AI",
      renderEmailHtml(
        "You're invited",
        `You've been invited to join your organization on BharatSales AI as a <strong>${role}</strong>. This link expires in 72 hours.`,
        { label: 'Set Up Your Account', url: inviteLink }
      )
    );

    const result = saved.toObject();
    delete result.password;

    const response: { message: string; user: any; inviteToken?: string } = {
      message: 'Invitation sent successfully',
      user: result,
    };
    // The invite token is a credential (it lets whoever holds it set the
    // account's password) — it is delivered only by email, and exposed in the
    // response solely for the automated test suite.
    if (isTestRuntime()) {
      response.inviteToken = inviteToken;
    }
    return response;
  }

  // Enforces the same "who may touch this specific user" rule for both
  // update and delete: a Distributor may only manage their own staff, and
  // a Sales Manager may only manage users on their own reporting team.
  // Organization Admin / Super Admin are unrestricted within the org.
  private async assertCanManageUser(organizationId: string, actor: any, target: any) {
    if (actor.role === 'Distributor') {
      if (!actor.distributorId || target.distributorId !== actor.distributorId) {
        throw new ForbiddenException('Distributors can only manage their own staff.');
      }
      return;
    }
    if (actor.role === 'Sales Manager') {
      const teamUserIds = await this.hierarchyService.getTeamUserIds(organizationId, actor.sub);
      if (!teamUserIds.includes(target._id.toString())) {
        throw new ForbiddenException('Sales Managers can only manage users on their own team.');
      }
      return;
    }
  }

  async updateUser(organizationId: string, actor: any, id: string, rawUpdateData: Partial<User> & { password?: string }) {
    // Whitelist: never mass-assign privileged fields (platformAdmin,
    // distributorId, emailVerified, lockout counters, organizationId...).
    const updateData: any = pickWritableUserFields(rawUpdateData);
    const actorRole = actor.role;
    if (updateData.role === 'Super Admin' && actorRole !== 'Super Admin') {
      throw new ForbiddenException('Only Super Admins can assign the Super Admin role.');
    }
    if (updateData.role === 'Organization Admin' && !['Organization Admin', 'Super Admin'].includes(actorRole)) {
      throw new ForbiddenException('Only Organization Admins can assign the Organization Admin role.');
    }
    if (actorRole === 'Distributor' && updateData.role && updateData.role !== 'Distributor') {
      throw new ForbiddenException('Distributors can only assign the Distributor role to their staff.');
    }
    // A Sales Manager may not promote team members (to Sales Manager,
    // Distributor, ...) — role changes beyond Sales Representative are an
    // Organization Admin decision.
    if (actorRole === 'Sales Manager' && updateData.role && updateData.role !== 'Sales Representative') {
      throw new ForbiddenException('Sales Managers cannot change a user to the ' + updateData.role + ' role.');
    }
    // Setting another user's password or email hands the actor that account.
    // Only Organization/Super Admins may do that; everyone else must go
    // through the invite / forgot-password flows.
    const isAdminActor = ['Organization Admin', 'Super Admin'].includes(actorRole);
    const isSelf = String(actor.sub ?? actor.id ?? '') === String(id);
    if (!isAdminActor && !isSelf && (updateData.password !== undefined || updateData.email !== undefined)) {
      throw new ForbiddenException("Only an Organization Admin can change another user's password or email.");
    }

    const target = await this.userModel.findOne({ _id: id, organizationId }).exec();
    if (!target) {
      throw new NotFoundException('User not found');
    }
    await this.assertCanManageUser(organizationId, actor, target);

    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    const user = await this.userModel.findOneAndUpdate(
      { _id: id, organizationId },
      { $set: updateData },
      { new: true }
    ).select('-password').exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async deleteUser(organizationId: string, actor: any, id: string) {
    const target = await this.userModel.findOne({ _id: id, organizationId }).exec();
    if (!target) {
      throw new NotFoundException('User not found');
    }
    await this.assertCanManageUser(organizationId, actor, target);

    await this.userModel.deleteOne({ _id: id, organizationId }).exec();
    return { deleted: true };
  }
}
