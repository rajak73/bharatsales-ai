import { pickCurrentTarget } from './targets';

describe('pickCurrentTarget (rep home)', () => {
  const now = new Date('2026-09-22T10:00:00');
  const monthly = { entityType: 'User', entityId: 'u1', period: 'Monthly', startDate: '2026-09-01', endDate: '2026-09-30', targetValue: 500000 };

  it('falls back to the running Monthly target when there is no Daily one', () => {
    expect(pickCurrentTarget([monthly], 'u1', now)).toBe(monthly);
  });

  it('prefers a Daily target covering today', () => {
    const daily = { ...monthly, period: 'Daily', startDate: '2026-09-22', endDate: '2026-09-22' };
    expect(pickCurrentTarget([monthly, daily], 'u1', now)).toBe(daily);
  });

  it('ignores targets that are over, and other users\' targets', () => {
    const lastMonth = { ...monthly, startDate: '2026-08-01', endDate: '2026-08-31' };
    const someoneElse = { ...monthly, entityId: 'u2' };
    expect(pickCurrentTarget([lastMonth, someoneElse], 'u1', now)).toBeNull();
  });

  it('counts the whole last day of the period', () => {
    expect(pickCurrentTarget([monthly], 'u1', new Date('2026-09-30T22:00:00'))).toBe(monthly);
  });
});
