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
});
