import { SyncService } from './sync.service';


describe('SyncService', () => {
  let service: SyncService;

  beforeEach(async () => {
    service = new SyncService(
      {} as any, {} as any, {} as any, {} as any, {} as any, {} as any,
      {} as any, {} as any,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
