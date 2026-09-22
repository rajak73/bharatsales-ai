/**
 * YYYY-MM-DD of `d` in the browser's own time zone. `toISOString()` gives the
 * UTC date instead, which in India is the previous day until 05:30 and turns
 * local midnight (e.g. the 1st of the month) into the day before.
 */
export function localISODate(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
