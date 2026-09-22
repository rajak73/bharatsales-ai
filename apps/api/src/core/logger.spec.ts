import { Logger, sanitizeLogValue } from './logger';

describe('Logger', () => {
  it('replaces CR/LF in string values so a client cannot forge log lines', () => {
    expect(sanitizeLogValue('a\r\nFAKE] admin login\nb\rc')).toBe('a FAKE] admin login b c');
    const err = new Error('x');
    expect(sanitizeLogValue(err)).toBe(err);
  });

  it('writes sanitized arguments', () => {
    const spy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    new Logger('Ctx').warn('user\nforged', 'second\r\nline', 3);
    expect(spy).toHaveBeenCalledWith('[Ctx]', 'user forged', 'second line', 3);
    spy.mockRestore();
  });
});
