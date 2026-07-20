import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User } from '@bharatsales/shared-types';

@Injectable()
export class UsersService {
  constructor(@InjectModel('User') private readonly userModel: Model<any>) {}

  async findAllByOrgId(organizationId: string) {
    return this.userModel.find({ organizationId }).select('-password').exec();
  }

  async createUser(organizationId: string, actorRole: string, userData: Partial<User> & { password?: string }) {
    if (userData.role === 'Super Admin' && actorRole !== 'Super Admin') {
      throw new ForbiddenException('Only Super Admins can create other Super Admins.');
    }

    if (!userData.email) {
      throw new BadRequestException('Email is required');
    }
    
    // Check if user exists
    const existing = await this.userModel.findOne({ email: userData.email }).exec();
    if (existing) {
      throw new BadRequestException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(userData.password || 'password123', 10);
    
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

  async inviteUser(organizationId: string, actorRole: string, email: string, role: string) {
    if (role === 'Super Admin' && actorRole !== 'Super Admin') {
      throw new ForbiddenException('Only Super Admins can invite other Super Admins.');
    }

    if (!email) {
      throw new BadRequestException('Email is required');
    }

    const existing = await this.userModel.findOne({ email }).exec();
    if (existing) {
      throw new BadRequestException('Email already exists in the system');
    }

    // Creating a user in "Invited" status with a random password.
    // In a real application, you'd send an email with a setup link.
    const randomPassword = await bcrypt.hash(Math.random().toString(36).slice(-8), 10);
    const newUser = new this.userModel({
      email,
      role,
      name: 'Invited User',
      password: randomPassword,
      organizationId,
      status: 'Invited'
    });

    const saved = await newUser.save();
    const result = saved.toObject();
    delete result.password;
    
    return {
      message: 'Invitation sent successfully',
      user: result
    };
  }

  async updateUser(organizationId: string, actorRole: string, id: string, updateData: Partial<User> & { password?: string }) {
    if (updateData.role === 'Super Admin' && actorRole !== 'Super Admin') {
      throw new ForbiddenException('Only Super Admins can assign the Super Admin role.');
    }

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

  async deleteUser(organizationId: string, id: string) {
    const user = await this.userModel.findOneAndDelete({ _id: id, organizationId }).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return { deleted: true };
  }
}
