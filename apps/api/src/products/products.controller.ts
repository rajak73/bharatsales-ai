import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, UseInterceptors, Request } from '@nestjs/common';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AuditInterceptor } from '../audit/audit.interceptor';
import { AuditEntity } from '../audit/audit.decorator';
import { Product } from '@bharatsales/shared-types';

@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async getProducts(@Request() req: any) {
    const orgId = req.user.orgId;
    return this.productsService.findAllByOrgId(orgId);
  }

  @Get('catalog')
  async getCatalog(@Request() req: any) {
    const orgId = req.user.orgId;
    return this.productsService.getCatalog(orgId);
  }

  @Post()
  @Roles('Super Admin', 'Company Admin')
  @AuditEntity('Product')
  async createProduct(@Request() req: any, @Body() productData: Omit<Product, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>) {
    const orgId = req.user.orgId;
    return this.productsService.create(orgId, productData);
  }

  @Put(':id')
  @Roles('Super Admin', 'Company Admin')
  @AuditEntity('Product')
  async updateProduct(@Request() req: any, @Param('id') id: string, @Body() updateData: Partial<Product>) {
    const orgId = req.user.orgId;
    return this.productsService.update(orgId, id, updateData);
  }

  @Delete(':id')
  @Roles('Super Admin', 'Company Admin')
  @AuditEntity('Product')
  async deleteProduct(@Request() req: any, @Param('id') id: string) {
    const orgId = req.user.orgId;
    return this.productsService.remove(orgId, id);
  }
}
