import { PriceListsService } from './price-lists.service';

describe('PriceListsService update query safety', () => {
  const findOneAndUpdate = jest.fn();
  const service = new PriceListsService({ findOneAndUpdate } as any);

  afterEach(() => jest.clearAllMocks());

  it('keeps nested pricing rules but drops operator and dotted keys', async () => {
    findOneAndUpdate.mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: 'p1' }) });

    await service.update('org1', 'p1', {
      name: 'Wholesale',
      pricingRules: { sku1: { price: 10, tiers: [1, 2] }, $where: 'x', 'a.b': 1, flag: true, none: null },
    } as any);

    expect(findOneAndUpdate).toHaveBeenCalledWith(
      { _id: 'p1', organizationId: 'org1' },
      { $set: { name: 'Wholesale', pricingRules: { sku1: { price: 10, tiers: [1, 2] }, flag: true, none: null } } },
      { new: true },
    );
  });

  it('coerces the id to a string', async () => {
    findOneAndUpdate.mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: 'p1' }) });
    await service.update('org1', { $ne: null } as any, { name: 'X' } as any);
    expect(findOneAndUpdate.mock.calls[0][0]._id).toBe('[object Object]');
  });
});
