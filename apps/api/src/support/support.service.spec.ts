import { Test, TestingModule } from '@nestjs/testing';
import { SupportService } from './support.service';
import { getModelToken } from '@nestjs/mongoose';

describe('SupportService', () => {
  let service: SupportService;

  const mockTicketModel = {
    find: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupportService,
        { provide: getModelToken('SupportTicket'), useValue: mockTicketModel },
      ],
    }).compile();

    service = module.get<SupportService>(SupportService);
    (service as any).ticketModel = function (data: any) {
      this.save = jest.fn().mockResolvedValue({ ...data, _id: 'ticket1' });
    };
    Object.assign((service as any).ticketModel, mockTicketModel);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAllForOrg', () => {
    it('should scope tickets to the given organization', async () => {
      mockTicketModel.find.mockReturnValue({ sort: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([]) }) });
      await service.findAllForOrg('org1');
      expect(mockTicketModel.find).toHaveBeenCalledWith({ organizationId: 'org1' });
    });
  });

  describe('findAllGlobal', () => {
    it('should query without any organizationId filter', async () => {
      mockTicketModel.find.mockReturnValue({ sort: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([]) }) });
      await service.findAllGlobal();
      expect(mockTicketModel.find).toHaveBeenCalledWith();
    });
  });

  describe('updateStatus', () => {
    it('should throw NotFoundException if ticket does not exist', async () => {
      mockTicketModel.findByIdAndUpdate.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      await expect(service.updateStatus('missing', 'Resolved')).rejects.toThrow('Ticket not found');
    });
  });
});
