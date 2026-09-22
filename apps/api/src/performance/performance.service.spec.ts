import { PerformanceService } from './performance.service';

describe('PerformanceService', () => {
  let service: PerformanceService;

  const emptyQuery = { exec: jest.fn().mockResolvedValue([]) };
  const mockOrderModel = { find: jest.fn().mockReturnValue(emptyQuery) };
  const mockCollectionModel = { find: jest.fn().mockReturnValue(emptyQuery) };
  const mockVisitModel = { find: jest.fn().mockReturnValue(emptyQuery) };
  const mockUserModel = {
    find: jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([{ _id: 'rep1' }, { _id: 'rep2' }]) }) }),
  };
  const mockHierarchyService = { getTeamUserIds: jest.fn().mockResolvedValue([]) };
  const mockTargetsService = { getTargetsForEntities: jest.fn().mockResolvedValue([]) };

  beforeEach(async () => {
    service = new PerformanceService(
      {} as any,
      mockOrderModel as any,
      mockCollectionModel as any,
      mockVisitModel as any,
      mockUserModel as any,
      mockHierarchyService as any,
      mockTargetsService as any,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateTeamDSR', () => {
    it('should resolve the team as all org Sales Representatives for an Organization Admin, not via territory lookup', async () => {
      await service.generateTeamDSR('org1', 'admin1', '2026-01-01', 'Organization Admin');

      expect(mockUserModel.find).toHaveBeenCalledWith({ organizationId: 'org1', role: 'Sales Representative' });
      expect(mockHierarchyService.getTeamUserIds).not.toHaveBeenCalled();
    });

    it('should still use territory-based team resolution for a Sales Manager', async () => {
      mockHierarchyService.getTeamUserIds.mockResolvedValueOnce([]);
      await service.generateTeamDSR('org1', 'manager1', '2026-01-01', 'Sales Manager');

      expect(mockHierarchyService.getTeamUserIds).toHaveBeenCalledWith('org1', 'manager1');
    });
  });

  describe('getTeamTargets', () => {
    it('should pass an org-wide rep list to getTargetsForEntities for an Organization Admin', async () => {
      await service.getTeamTargets('org1', 'admin1', 'Organization Admin');
      expect(mockTargetsService.getTargetsForEntities).toHaveBeenCalledWith('org1', ['rep1', 'rep2']);
    });
  });
});
