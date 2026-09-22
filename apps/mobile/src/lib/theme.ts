// Design tokens now live in src/theme/tokens.ts (spacing/radius/shadow/
// typography added on top of this file's original flat color palette) —
// re-exported here so every screen written against the original
// `import { colors, formatCurrency } from '../../src/lib/theme'` path
// keeps working unchanged.
export { colors, spacing, radius, shadow, typography, fontFamily } from '../theme/tokens';

// Indian digit grouping (₹1,23,45,678) via Intl.NumberFormat('en-IN') —
// formatter instances are cached because constructing one is comparatively
// expensive and these run once per list row.
let inrFormatter: Intl.NumberFormat | null = null;
function getInrFormatter(): Intl.NumberFormat | null {
  if (inrFormatter) return inrFormatter;
  try {
    inrFormatter = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
  } catch {
    inrFormatter = null;
  }
  return inrFormatter;
}

export function formatCurrency(amount: number | undefined | null): string {
  const raw = Number(amount ?? 0);
  const value = Number.isFinite(raw) ? raw : 0;
  const formatter = getInrFormatter();
  const digits = formatter ? formatter.format(Math.abs(value)) : Math.round(Math.abs(value)).toLocaleString('en-IN');
  return (value < 0 ? '-₹' : '₹') + digits;
}

export function formatNumber(value: number | undefined | null): string {
  const raw = Number(value ?? 0);
  const n = Number.isFinite(raw) ? raw : 0;
  const formatter = getInrFormatter();
  return formatter ? formatter.format(n) : String(Math.round(n));
}

// Consistent en-IN date/time strings ("22 Sept 2026", "22 Sept, 3:45 pm")
// so no screen falls back to the device's default (often US) locale.
function toDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === '') return null;
  const d = value instanceof Date ? value : new Date(value as string);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDate(value: unknown, opts: { withYear?: boolean } = {}): string {
  const d = toDate(value);
  if (!d) return '—';
  const withYear = opts.withYear ?? true;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', ...(withYear ? { year: 'numeric' } : {}) });
}

export function formatTime(value: unknown): string {
  const d = toDate(value);
  if (!d) return '—';
  return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
}

export function formatDateTime(value: unknown): string {
  const d = toDate(value);
  if (!d) return '—';
  return d.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
}

export function getUserInitials(name?: string, email?: string): string {
  const source = name || email || '?';
  return source.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
}

export function isToday(dateValue: unknown): boolean {
  if (!dateValue) return false;
  const d = new Date(dateValue as string);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}
