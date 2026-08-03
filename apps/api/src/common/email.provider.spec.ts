import { BrevoEmailProvider } from './email.provider';

describe('BrevoEmailProvider', () => {
  const originalFetch = global.fetch;
  const originalApiKey = process.env.BREVO_API_KEY;

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.BREVO_API_KEY = originalApiKey;
    jest.clearAllMocks();
  });

  it('logs instead of sending when BREVO_API_KEY is not set (dev-mode fallback)', async () => {
    delete process.env.BREVO_API_KEY;
    const provider = new BrevoEmailProvider();
    global.fetch = jest.fn();

    const result = await provider.sendEmail('user@example.com', 'Subject', 'Body');

    expect(result).toBe(true);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('calls the Brevo transactional email API when a key is configured', async () => {
    process.env.BREVO_API_KEY = 'test-key';
    const provider = new BrevoEmailProvider();
    global.fetch = jest.fn().mockResolvedValue({ ok: true });

    const result = await provider.sendEmail('user@example.com', 'Subject', 'Body');

    expect(result).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.brevo.com/v3/smtp/email',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'api-key': 'test-key' }),
      })
    );
  });

  it('returns false when Brevo responds with a non-ok status', async () => {
    process.env.BREVO_API_KEY = 'test-key';
    const provider = new BrevoEmailProvider();
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 401, text: () => Promise.resolve('Unauthorized') });

    const result = await provider.sendEmail('user@example.com', 'Subject', 'Body');

    expect(result).toBe(false);
  });

  it('returns false when the fetch call throws', async () => {
    process.env.BREVO_API_KEY = 'test-key';
    const provider = new BrevoEmailProvider();
    global.fetch = jest.fn().mockRejectedValue(new Error('network down'));

    const result = await provider.sendEmail('user@example.com', 'Subject', 'Body');

    expect(result).toBe(false);
  });
});
