import { ApprovalsService } from './approvals.service';

function modelMock() {
  const exec = jest.fn().mockResolvedValue({ _id: 'a1' });
  return { findOneAndUpdate: jest.fn().mockReturnValue({ exec }) };
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
});
