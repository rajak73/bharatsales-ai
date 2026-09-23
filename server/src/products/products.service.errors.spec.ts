import { ProductsService } from './products.service';
import { BadRequestException, NotFoundException } from '../core/http-errors';

describe('ProductsService error statuses', () => {
  const productModel: any = {
    findOneAndUpdate: jest.fn(() => ({ exec: jest.fn().mockResolvedValue(null) })),
    findOneAndDelete: jest.fn(() => ({ exec: jest.fn().mockResolvedValue(null) })),
  };
  const service = new ProductsService(productModel, {} as any);

  it('answers 404 when updating or deleting a product that does not exist', async () => {
    await expect(service.update('org1', 'p1', { name: 'x' } as any)).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.remove('org1', 'p1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('answers 400 when PTR exceeds MRP', async () => {
    await expect(service.update('org1', 'p1', { pricing: { ptr: 10, mrp: 5 } } as any)).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.create('org1', { pricing: { ptr: 10, mrp: 5 } } as any)).rejects.toBeInstanceOf(BadRequestException);
  });
});
