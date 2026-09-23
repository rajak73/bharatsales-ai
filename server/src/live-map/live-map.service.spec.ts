import { LiveMapService } from './live-map.service';

describe('LiveMapService', () => {
  let service: LiveMapService;

  const mockAttendanceModel = { find: jest.fn() };
  const mockVisitModel = { findOne: jest.fn() };
  const mockLocationPingModel = { findOne: jest.fn() };

  beforeEach(async () => {
    service = new LiveMapService(mockAttendanceModel as any, mockVisitModel as any, mockLocationPingModel as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should scope the active-sessions query by organizationId so other orgs\' live reps never leak in', async () => {
    mockAttendanceModel.find.mockReturnValue({ populate: jest.fn().mockResolvedValue([]) });

    await service.getLiveReps('org1');

    expect(mockAttendanceModel.find).toHaveBeenCalledWith({ organizationId: 'org1', status: { $in: ['Active', 'On_Break'] } });
  });

  it('should scope the active-visit lookup for each rep by organizationId too', async () => {
    const session = { user: { _id: 'user1', name: 'Rep One' }, startLocation: { lat: 1, lng: 2 }, startTime: new Date() };
    mockAttendanceModel.find.mockReturnValue({ populate: jest.fn().mockResolvedValue([session]) });
    mockVisitModel.findOne.mockReturnValue({ populate: jest.fn().mockReturnValue({ sort: jest.fn().mockResolvedValue(null) }) });
    mockLocationPingModel.findOne.mockReturnValue({ sort: jest.fn().mockResolvedValue(null) });

    await service.getLiveReps('org1');

    expect(mockVisitModel.findOne).toHaveBeenCalledWith(expect.objectContaining({ organizationId: 'org1' }));
  });
});
