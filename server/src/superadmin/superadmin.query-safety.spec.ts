import { SuperadminService } from './superadmin.service';

describe('SuperadminService query safety', () => {
  const leanChain = (result: any) => ({ select: jest.fn().mockReturnValue({ lean: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(result) }) }) });
  const userModel: any = { find: jest.fn() };
  const tenantModel: any = { find: jest.fn(), findByIdAndUpdate: jest.fn() };
  const service = new SuperadminService(
    tenantModel, userModel, {} as any, {} as any, {} as any, {} as any,
    { create: jest.fn().mockResolvedValue(undefined) } as any,
  );

  afterEach(() => jest.clearAllMocks());

  it('ignores non-string user filters from the query string', async () => {
    userModel.find.mockReturnValue(leanChain([]));
    tenantModel.find.mockReturnValue(leanChain([]));

    await service.getAllUsers({ role: { $ne: '' } as any, organizationId: ['a', 'b'] as any, status: 'Active' });

    expect(userModel.find).toHaveBeenCalledWith({ status: 'Active' });
  });

  it('only writes primitive subscription values', async () => {
    tenantModel.findByIdAndUpdate.mockReturnValue({ exec: jest.fn().mockResolvedValue({ plan: 'Growth' }) });
    userModel.find.mockReturnValue({ select: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([]) }) });

    await service.updateSubscription('t1', { plan: 'Growth', subscriptionUsersLimit: '5' as any });

    expect(tenantModel.findByIdAndUpdate).toHaveBeenCalledWith('t1', { plan: 'Growth', subscriptionUsersLimit: 5 }, { new: true });
  });
});
