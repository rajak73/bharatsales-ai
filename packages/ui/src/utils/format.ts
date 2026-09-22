/**
 * Indian-locale formatting helpers. Always use these for money, counts and
 * dates so the whole app reads the same (₹1,23,456.00, 22 Sept 2026).
 */

type Numeric = number | string | null | undefined;

const toNumber = (value: Numeric): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
};

const numberFormatters = new Map<string, Intl.NumberFormat>();
function nf(options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = JSON.stringify(options);
  let f = numberFormatters.get(key);
  if (!f) {
    f = new Intl.NumberFormat('en-IN', options);
    numberFormatters.set(key, f);
  }
  return f;
}

export interface FormatINROptions {
  /** Fraction digits. Default: 2 when the value has paise, otherwise 0. */
  decimals?: number;
  /** Compact Indian units: ₹1.2K, ₹4.5L, ₹3.2Cr. */
  compact?: boolean;
  /** Text returned for null/undefined/NaN. Default '—'. */
  fallback?: string;
}

/** ₹ amount with Indian digit grouping: formatINR(123456.5) → "₹1,23,456.50". */
export function formatINR(value: Numeric, options: FormatINROptions = {}): string {
  const n = toNumber(value);
  if (n === null) return options.fallback ?? '—';
  if (options.compact) return `${n < 0 ? '-' : ''}₹${compactIndian(Math.abs(n), options.decimals)}`;
  const decimals = options.decimals ?? (Number.isInteger(n) ? 0 : 2);
  return nf({ style: 'currency', currency: 'INR', minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(n);
}

/** Plain number with Indian grouping: formatNumber(1234567) → "12,34,567". */
export function formatNumber(value: Numeric, options: { decimals?: number; compact?: boolean; fallback?: string } = {}): string {
  const n = toNumber(value);
  if (n === null) return options.fallback ?? '—';
  if (options.compact) return `${n < 0 ? '-' : ''}${compactIndian(Math.abs(n), options.decimals)}`;
  return nf({ maximumFractionDigits: options.decimals ?? 2, minimumFractionDigits: options.decimals ?? 0 }).format(n);
}

/** Percentage: formatPercent(12.345) → "12.3%". Pass a ratio with { ratio: true }. */
export function formatPercent(value: Numeric, options: { decimals?: number; ratio?: boolean; signed?: boolean; fallback?: string } = {}): string {
  const n = toNumber(value);
  if (n === null) return options.fallback ?? '—';
  const pct = options.ratio ? n * 100 : n;
  const text = `${nf({ maximumFractionDigits: options.decimals ?? 1 }).format(pct)}%`;
  return options.signed && pct > 0 ? `+${text}` : text;
}

/** Indian short scale: 1.2K, 4.5L (lakh), 3.2Cr (crore). */
export function compactIndian(n: number, decimals = 1): string {
  const units: [number, string][] = [
    [1e7, 'Cr'],
    [1e5, 'L'],
    [1e3, 'K'],
  ];
  for (const [size, suffix] of units) {
    if (n >= size) {
      const v = n / size;
      return `${nf({ maximumFractionDigits: v >= 100 ? 0 : decimals }).format(v)}${suffix}`;
    }
  }
  return nf({ maximumFractionDigits: decimals }).format(n);
}

type DateInput = Date | string | number | null | undefined;

const toDate = (value: DateInput): Date | null => {
  if (value === null || value === undefined || value === '') return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const dateFormatters = new Map<string, Intl.DateTimeFormat>();
function df(options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = JSON.stringify(options);
  let f = dateFormatters.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat('en-IN', options);
    dateFormatters.set(key, f);
  }
  return f;
}

export type DateStyle = 'short' | 'medium' | 'long' | 'datetime' | 'time';

const DATE_STYLES: Record<DateStyle, Intl.DateTimeFormatOptions> = {
  short: { day: '2-digit', month: '2-digit', year: 'numeric' }, // 22/09/2026
  medium: { day: 'numeric', month: 'short', year: 'numeric' }, // 22 Sept 2026
  long: { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }, // Tue, 22 September 2026
  datetime: { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }, // 22 Sept 2026, 3:45 pm
  time: { hour: 'numeric', minute: '2-digit', hour12: true }, // 3:45 pm
};

/** formatDate('2026-09-22') → "22 Sept 2026". Style: short | medium | long | datetime | time. */
export function formatDate(value: DateInput, style: DateStyle = 'medium', fallback = '—'): string {
  const d = toDate(value);
  return d ? df(DATE_STYLES[style]).format(d) : fallback;
}

/** formatDateTime(x) → "22 Sept 2026, 3:45 pm". */
export function formatDateTime(value: DateInput, fallback = '—'): string {
  return formatDate(value, 'datetime', fallback);
}

/** "just now", "5 min ago", "3 h ago", "2 days ago", then falls back to a date. */
export function formatRelativeTime(value: DateInput, fallback = '—'): string {
  const d = toDate(value);
  if (!d) return fallback;
  const diff = Date.now() - d.getTime();
  const abs = Math.abs(diff);
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (abs < minute) return 'just now';
  const suffix = diff >= 0 ? ' ago' : ' from now';
  if (abs < hour) return `${Math.round(abs / minute)} min${suffix}`;
  if (abs < day) return `${Math.round(abs / hour)} h${suffix}`;
  if (abs < 7 * day) {
    const days = Math.round(abs / day);
    return `${days} day${days === 1 ? '' : 's'}${suffix}`;
  }
  return formatDate(d);
}

/** "Rahul Kumar Sharma" → "RS". */
export function getInitials(name: string | null | undefined, fallback = '?'): string {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return fallback;
  const first = parts[0][0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? '' : '';
  return (first + last).toUpperCase();
}
