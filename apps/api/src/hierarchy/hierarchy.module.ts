import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HierarchyController } from './hierarchy.controller';
import { HierarchyService } from './hierarchy.service';
import { HierarchyNodeSchema } from '../schemas/hierarchy.schema';
import { UserSchema } from '../schemas/user.schema';

@Module({
  imports: [MongooseModule.forFeature([
    { name: 'HierarchyNode', schema: HierarchyNodeSchema },
    { name: 'User', schema: UserSchema }
  ])],
  controllers: [HierarchyController],
  providers: [HierarchyService],
  exports: [HierarchyService],
})
export class HierarchyModule {}
