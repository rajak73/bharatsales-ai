import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  const originalFetch = global.fetch;
  const originalApiKey = process.env.BREVO_API_KEY;

  const mockNotificationModel: any = jest.fn().mockImplementation((data: any) => ({
    ...data,
    _id: 'log1',
    save: jest.fn().mockResolvedValue(undefined),
  }));

  const mockAppNotificationModel = {
    find: jest.fn(),
    findOneAndUpdate: jest.fn(),
    updateMany: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: getModelToken('NotificationLog'), useValue: mockNotificationModel },
        { provide: getModelToken('AppNotification'), useValue: mockAppNotificationModel },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.BREVO_API_KEY = originalApiKey;
    jest.clearAllMocks();
  });

  describe('sendSms', () => {
    it('logs as Sent without calling Brevo when BREVO_API_KEY is not set', async () => {
      delete process.env.BREVO_API_KEY;
      // Service already constructed with the env var read at instantiation
      // time, so re-create it for this test's env state.
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          NotificationsService,
          { provide: getModelToken('NotificationLog'), useValue: mockNotificationModel },
          { provide: getModelToken('AppNotification'), useValue: mockAppNotificationModel },
        ],
      }).compile();
      service = module.get<NotificationsService>(NotificationsService);
      global.fetch = jest.fn();

      const result = await service.sendSms('org1', '+919876543210', 'Hello');

      expect(global.fetch).not.toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('calls the Brevo SMS API and marks Failed when the response is not ok', async () => {
      process.env.BREVO_API_KEY = 'test-key';
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          NotificationsService,
          { provide: getModelToken('NotificationLog'), useValue: mockNotificationModel },
          { provide: getModelToken('AppNotification'), useValue: mockAppNotificationModel },
        ],
      }).compile();
      service = module.get<NotificationsService>(NotificationsService);
      global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 400, text: () => Promise.resolve('bad request') });

      const result = await service.sendSms('org1', '+919876543210', 'Hello');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.brevo.com/v3/transactionalSMS/sms',
        expect.objectContaining({ method: 'POST' })
      );
      expect(result.success).toBe(false);
    });
  });
});
