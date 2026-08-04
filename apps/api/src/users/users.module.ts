import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserSchema } from '../schemas/user.schema';
import { TokenSchema } from '../schemas/token.schema';
import { Tenant, TenantSchema } from '../schemas/tenant.schema';
import { HierarchyModule } from '../hierarchy/hierarchy.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'User', schema: UserSchema },
      { name: 'Token', schema: TokenSchema },
      { name: Tenant.name, schema: TenantSchema }
    ]),
    HierarchyModule,
    CommonModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
