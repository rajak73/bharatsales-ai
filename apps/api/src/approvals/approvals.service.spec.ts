import { ApprovalsService } from './approvals.service';

function modelMock() {
  const exec = jest.fn().mockResolvedValue({ _id: 'a1' });
  return {
    findOneAndUpdate: jest.fn().mockReturnValue({ exec }),
    findOne: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: 'a1', order: 'ORD-1', status: 'Pending' }) }),
  };
}

describe('ApprovalsService update sanitising', () => {
  it('only $sets allow-listed approval fields, coerced to strings', async () => {
    const approvalModel = modelMock();
    const service = new ApprovalsService(approvalModel as any, modelMock() as any);
    await service.updateApproval('org1', 'a1', {
      status: 'Approved',
      reason: { $gt: '' },
      organizationId: 'other-org',
      $where: 'sleep(1000)',
    });
    const [filter, update] = approvalModel.findOneAndUpdate.mock.calls[0];
    expect(filter).toEqual({ _id: 'a1', organizationId: 'org1' });
    expect(update).toEqual({ $set: { status: 'Approved', reason: '[object Object]' } });
  });

  it('only $sets allow-listed rule fields and keeps enabled boolean', async () => {
    const ruleModel = modelMock();
    const service = new ApprovalsService(modelMock() as any, ruleModel as any);
    await service.updateRule('org1', 'r1', { trigger: 'x', enabled: false, organizationId: 'evil' });
    expect(ruleModel.findOneAndUpdate.mock.calls[0][1]).toEqual({ $set: { trigger: 'x', enabled: false } });
  });

  it('deciding a pending request acts on its order once', async () => {
    const approvalModel = modelMock();
    const service = new ApprovalsService(approvalModel as any, modelMock() as any);
    const handler = jest.fn().mockResolvedValue(undefined);
    service.setDecisionHandler(handler);

    await service.updateApproval('org1', 'a1', { status: 'Approved' }, 'mgr1');
    expect(handler).toHaveBeenCalledWith('org1', 'ORD-1', 'Approved', 'mgr1', undefined);

    // Editing the priority (no decision) doesn't touch the order.
    handler.mockClear();
    await service.updateApproval('org1', 'a1', { priority: 'Low' }, 'mgr1');
    expect(handler).not.toHaveBeenCalled();
  });
});
