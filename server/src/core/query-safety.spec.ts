import { asId, toSafeUpdate } from './query-safety';

describe('query-safety', () => {
  describe('asId', () => {
    it('keeps strings, stringifies objects/arrays and leaves absent values alone', () => {
      expect(asId('abc')).toBe('abc');
      expect(asId({ $ne: null } as any)).toBe('[object Object]');
      expect(asId(['a', 'b'] as any)).toBe('a,b');
      expect(asId(undefined)).toBeUndefined();
      expect(asId(null)).toBeNull();
    });
  });

  describe('toSafeUpdate', () => {
    it('keeps valid data unchanged, including top-level dotted $set paths', () => {
      const when = new Date('2026-01-01T00:00:00Z');
      const out = toSafeUpdate({
        name: 'A',
        count: 3,
        active: false,
        none: null,
        when,
        'commercial.assignedDistributorId': 'd1',
        sequence: [{ outletId: 'o1', sequenceOrder: 1 }],
        skip: undefined,
      });
      expect(out).toEqual({
        name: 'A',
        count: 3,
        active: false,
        none: null,
        when,
        'commercial.assignedDistributorId': 'd1',
        sequence: [{ outletId: 'o1', sequenceOrder: 1 }],
      });
      expect(out.when).not.toBe(when);
    });

    it('drops operator, prototype and nested dotted keys at every level', () => {
      const body = JSON.parse('{"$where":"1","__proto__":{"x":1},"a":{"$gt":1,"b.c":2,"ok":1},"list":[{"$ne":1,"v":2}]}');
      const out = toSafeUpdate(body);
      expect(out).toEqual({ a: { ok: 1 }, list: [{ v: 2 }] });
      expect(Object.getPrototypeOf(out)).toBe(Object.prototype);
    });

    it('returns an empty object for non-object input', () => {
      expect(toSafeUpdate(undefined)).toEqual({});
      expect(toSafeUpdate('x')).toEqual({});
      expect(toSafeUpdate([1])).toEqual({});
    });
  });
});
