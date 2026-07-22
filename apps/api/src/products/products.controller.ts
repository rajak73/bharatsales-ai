import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, UseInterceptors, Request } from '@nestjs/common';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { AuditInterceptor } from '../audit/audit.interceptor';
import { AuditEntity } from '../audit/audit.decorator';
import { Product } from '@bharatsales/shared-types';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { Resource, Action } from '@bharatsales/permissions';

@Controller('products')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditInterceptor)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

@RequirePermissions(Resource.Products, Action.Read)
  @Get()
  async getProducts(@Request() req: any) {
    const orgId = req.user.orgId;
    return this.productsService.findAllByOrgId(orgId);
  }

@RequirePermissions(Resource.Products, Action.Read)
  @Get('catalog')
  async getCatalog(@Request() req: any) {
    const orgId = req.user.orgId;
    return this.productsService.getCatalog(orgId);
  }

@RequirePermissions(Resource.Products, Action.Create)
  @Post()
    @AuditEntity('Product')
  async createProduct(@Request() req: any, @Body() productData: Omit<Product, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>) {
    const orgId = req.user.orgId;
    return this.productsService.create(orgId, productData);
  }

@RequirePermissions(Resource.Products, Action.Update)
  @Put(':id')
    @AuditEntity('Product')
  async updateProduct(@Request() req: any, @Param('id') id: string, @Body() updateData: Partial<Product>) {
    const orgId = req.user.orgId;
    return this.productsService.update(orgId, id, updateData);
  }

@RequirePermissions(Resource.Products, Action.Delete)
  @Delete(':id')
    @AuditEntity('Product')
  async deleteProduct(@Request() req: any, @Param('id') id: string) {
    const orgId = req.user.orgId;
    return this.productsService.remove(orgId, id);
  }
}
