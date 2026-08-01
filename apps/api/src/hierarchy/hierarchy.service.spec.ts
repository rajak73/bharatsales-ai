import { Test, TestingModule } from '@nestjs/testing';
import { HierarchyService } from './hierarchy.service';
import { getModelToken } from '@nestjs/mongoose';

describe('HierarchyService', () => {
  let service: HierarchyService;
  
  const mockHierarchyModel = {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    findOneAndDelete: jest.fn(),
    countDocuments: jest.fn(),
    create: jest.fn(),
  };

  class MockHierarchyModel {
    save: any;
    constructor(private data: any) {
      this.save = jest.fn().mockResolvedValue(this.data);
    }
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HierarchyService,
        {
          provide: getModelToken('HierarchyNode'),
          useValue: mockHierarchyModel,
        },
        {
          provide: getModelToken('User'),
          useValue: { findById: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<HierarchyService>(HierarchyService);
    // overriding the model constructor for 'new this.hierarchyModel'
    (service as any).hierarchyModel = function(data: any) {
      this.save = jest.fn().mockResolvedValue(data);
    };
    Object.assign((service as any).hierarchyModel, mockHierarchyModel);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createNode — manager territory propagation', () => {
    it('should additively grant the assigned manager access to the new node', async () => {
      (service as any).hierarchyModel = function (data: any) {
        this.save = jest.fn().mockResolvedValue({ ...data, _id: 'newNodeId' });
      };
      Object.assign((service as any).hierarchyModel, mockHierarchyModel);

      const mockUserModel = { updateOne: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({}) }) };
      (service as any).userModel = mockUserModel;

      await service.createNode('org1', { name: 'Territory X', level: 'Territory', managerId: 'manager1' } as any);

      expect(mockUserModel.updateOne).toHaveBeenCalledWith(
        { _id: 'manager1', organizationId: 'org1' },
        { $addToSet: { territoryIds: 'newNodeId' } }
      );
    });

    it('should not touch territoryIds when no manager is assigned', async () => {
      (service as any).hierarchyModel = function (data: any) {
        this.save = jest.fn().mockResolvedValue({ ...data, _id: 'newNodeId' });
      };
      Object.assign((service as any).hierarchyModel, mockHierarchyModel);

      const mockUserModel = { updateOne: jest.fn() };
      (service as any).userModel = mockUserModel;

      await service.createNode('org1', { name: 'Territory X', level: 'Territory' } as any);

      expect(mockUserModel.updateOne).not.toHaveBeenCalled();
    });
  });

  describe('updateNode — manager territory propagation', () => {
    it('should additively grant a reassigned manager access to the node', async () => {
      mockHierarchyModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: 'node1', parentId: null, level: 'Zone' }) });
      mockHierarchyModel.findOneAndUpdate.mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: 'node1' }) });

      const mockUserModel = { updateOne: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({}) }) };
      (service as any).userModel = mockUserModel;

      await service.updateNode('org1', 'node1', { managerId: 'manager2' } as any);

      expect(mockUserModel.updateOne).toHaveBeenCalledWith(
        { _id: 'manager2', organizationId: 'org1' },
        { $addToSet: { territoryIds: 'node1' } }
      );
    });
  });

  describe('updateNode', () => {
    it('should throw cyclical loop error if target parent is a descendant', async () => {
      // id = "A", trying to set parentId to "C"
      // DB has: C -> parent B, B -> parent A. So C is descendant of A.
      
      mockHierarchyModel.findOne.mockImplementation(({ _id }) => {
        return {
          exec: jest.fn().mockResolvedValue({
            _id: _id,
            parentId: _id === 'C' ? 'B' : (_id === 'B' ? 'A' : null),
            level: 'Zone'
          })
        };
      });

      await expect(
        service.updateNode('org1', 'A', { parentId: 'C', level: 'Territory' })
      ).rejects.toThrow('Cyclical hierarchy loop detected');
    });

    it('should throw error if depth limit is violated', async () => {
       mockHierarchyModel.findOne.mockImplementation(({ _id }) => {
        return {
          exec: jest.fn().mockResolvedValue({
            _id: _id,
            parentId: null,
            level: 'Region' // Parent is Region
          })
        };
      });

      await expect(
        service.updateNode('org1', 'A', { parentId: 'C', level: 'Zone' })
      ).rejects.toThrow('Invalid depth: A Zone cannot be a child of a Region');
    });
  });

  describe('deleteNode', () => {
    it('should throw error if node has children', async () => {
       mockHierarchyModel.countDocuments.mockImplementation(() => {
        return {
          exec: jest.fn().mockResolvedValue(2) // 2 children
        };
      });

      await expect(
        service.deleteNode('org1', 'A')
      ).rejects.toThrow('Cannot delete node with assigned children. Reassign children first.');
    });
  });

  describe('getTeamUserIds', () => {
    it('should resolve reps under the manager\'s descendant territories', async () => {
      const mockUserModel = {
        findById: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({ territoryIds: ['zone1'] }) }),
        find: jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([{ _id: 'rep1' }, { _id: 'rep2' }]) }) }),
      };
      (service as any).userModel = mockUserModel;

      let call = 0;
      mockHierarchyModel.find.mockImplementation(() => ({
        exec: jest.fn().mockResolvedValue(call++ === 0 ? [{ _id: 'territory1' }] : []),
      }));

      const result = await service.getTeamUserIds('org1', 'manager1');
      expect(result).toEqual(['rep1', 'rep2']);
      expect(mockUserModel.find).toHaveBeenCalledWith(expect.objectContaining({
        organizationId: 'org1',
        role: 'Sales Representative',
      }));
    });

    it('should return an empty array if the manager has no territories', async () => {
      const mockUserModel = {
        findById: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({ territoryIds: [] }) }),
        find: jest.fn(),
      };
      (service as any).userModel = mockUserModel;

      const result = await service.getTeamUserIds('org1', 'manager1');
      expect(result).toEqual([]);
      expect(mockUserModel.find).not.toHaveBeenCalled();
    });
  });
});
