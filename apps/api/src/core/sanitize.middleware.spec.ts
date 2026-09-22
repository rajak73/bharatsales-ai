import { sanitizeInput } from './sanitize.middleware';

function run(body: any, query: any = {}, params: any = {}) {
  const req: any = { body, query, params };
  const next = jest.fn();
  sanitizeInput(req, {} as any, next);
  expect(next).toHaveBeenCalled();
  return req;
}

describe('sanitizeInput', () => {
  it('removes Mongo operator and dotted keys at any depth', () => {
    const req = run({ email: { $ne: null }, nested: [{ 'a.b': 1, ok: 2 }], keep: 'x' });
    expect(req.body).toEqual({ email: {}, nested: [{ ok: 2 }], keep: 'x' });
  });

  it('removes prototype-pollution keys without touching Object.prototype', () => {
    const body = JSON.parse('{"__proto__":{"polluted":true},"constructor":{"prototype":{"x":1}},"name":"ok"}');
    const req = run(body);
    expect(Object.keys(req.body)).toEqual(['name']);
    expect(({} as any).polluted).toBeUndefined();
    expect(Object.getPrototypeOf(req.body)).toBe(Object.prototype);
  });
});
