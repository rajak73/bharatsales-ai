import { Test, TestingModule } from '@nestjs/testing';
import { BeatsService } from './beats.service';
import { getModelToken } from '@nestjs/mongoose';
import { HierarchyService } from '../hierarchy/hierarchy.service';

describe('BeatsService', () => {
  let service: BeatsService;

  const mockBeatModel = {};
  const mockBeatScheduleModel = { findOne: jest.fn().mockReturnValue({ populate: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }) }) };
  const mockVisitModel = {};
  const mockUserModel = {
    find: jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([{ _id: 'rep1' }, { _id: 'rep2' }]) }) }),
  };
  const mockHierarchyService = { getTeamUserIds: jest.fn().mockResolvedValue([]) };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BeatsService,
        { provide: getModelToken('Beat'), useValue: mockBeatModel },
        { provide: getModelToken('BeatSchedule'), useValue: mockBeatScheduleModel },
        { provide: getModelToken('Visit'), useValue: mockVisitModel },
        { provide: getModelToken('User'), useValue: mockUserModel },
        { provide: HierarchyService, useValue: mockHierarchyService },
      ],
    }).compile();

    service = module.get<BeatsService>(BeatsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getTeamBeatCompletion', () => {
    it('should resolve the team as all org Sales Representatives for an Organization Admin', async () => {
      const result = await service.getTeamBeatCompletion('org1', 'admin1', 'Organization Admin');

      expect(mockUserModel.find).toHaveBeenCalledWith({ organizationId: 'org1', role: 'Sales Representative' });
      expect(mockHierarchyService.getTeamUserIds).not.toHaveBeenCalled();
      expect(result.reps).toHaveLength(2);
    });

    it('should use territory-based resolution for a Sales Manager and return empty when they have no territories', async () => {
      const result = await service.getTeamBeatCompletion('org1', 'manager1', 'Sales Manager');

      expect(mockHierarchyService.getTeamUserIds).toHaveBeenCalledWith('org1', 'manager1');
      expect(result).toEqual({ teamCompletionPercentage: 0, reps: [] });
    });
  });
});
