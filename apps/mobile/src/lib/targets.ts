// Picks the target the rep home screen shows.
const PERIOD_ORDER = ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annual'];

export function pickCurrentTarget(targets: any[] | undefined, userId: string | undefined, now: Date = new Date()): any | null {
  if (!targets) return null;
  const covers = (t: any) => {
    const start = t.startDate ? new Date(t.startDate) : null;
    const end = t.endDate ? new Date(t.endDate) : null;
    if (end) end.setHours(23, 59, 59, 999);
    return (!start || isNaN(start.getTime()) || start <= now) && (!end || isNaN(end.getTime()) || end >= now);
  };
  const rank = (t: any) => {
    const i = PERIOD_ORDER.indexOf(t.period);
    return i === -1 ? PERIOD_ORDER.length : i;
  };
  return (
    targets
      .filter((t) => t.entityType === 'User' && (!userId || !t.entityId || t.entityId === userId) && covers(t))
      .sort((a, b) => rank(a) - rank(b))[0] || null
  );
}
