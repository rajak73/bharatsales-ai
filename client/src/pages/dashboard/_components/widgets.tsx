/**
 * Lightweight dashboard building blocks (no chart library): breakdown bars,
 * progress meters, recent-order lists, greeting helpers and a lazy wrapper for
 * the recharts bar chart.
 */
import { Suspense, lazy, type ComponentProps, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState, ProgressBar, StatusPill, buttonClassName, cn, formatINR, formatNumber } from '@bharatsales/ui';

export type ValueFormat = 'inr' | 'number';

export const fmt = (v: number, format: ValueFormat, compact = false) =>
  format === 'inr' ? formatINR(v, { compact }) : formatNumber(v, { compact });

export interface SeriesPoint {
  label: string;
  value: number;
  /** Optional secondary figure shown in the tooltip, e.g. order count. */
  meta?: string;
}

const LazyTrendBarChart = lazy(() => import('./charts'));

/** Lazy-loaded bar chart; shows a skeleton of the same height while recharts downloads. */
export function TrendBarChart(props: ComponentProps<typeof LazyTrendBarChart>) {
  return (
    <Suspense fallback={<div role="status" aria-label="Loading chart" className="animate-pulse rounded-lg bg-surface-subtle" style={{ height: props.height ?? 240 }} />}>
      <LazyTrendBarChart {...props} />
    </Suspense>
  );
}

/** Bucket items into the last `days` calendar days (oldest first). */
export function buildDailySeries<T>(
  items: T[],
  getDate: (item: T) => string | Date | undefined,
  getValue: (item: T) => number,
  days = 14,
  metaLabel?: (count: number) => string,
): SeriesPoint[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const buckets = Array.from({ length: days }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (days - 1 - i));
    return { key: d.toDateString(), date: d, value: 0, count: 0 };
  });
  const index = new Map(buckets.map((b, i) => [b.key, i]));
  for (const item of items) {
    const raw = getDate(item);
    if (!raw) continue;
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) continue;
    const i = index.get(d.toDateString());
    if (i === undefined) continue;
    buckets[i].value += getValue(item) || 0;
    buckets[i].count += 1;
  }
  const dayFmt = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' });
  return buckets.map((b) => ({ label: dayFmt.format(b.date), value: b.value, meta: metaLabel?.(b.count) }));
}

/** Horizontal proportion bars — status mixes, plan mixes, rep completion. */
export function BreakdownBars({
  items,
  format = 'number',
  emptyText = 'Nothing to show yet.',
  max: fixedMax,
}: {
  items: { key: string; label: ReactNode; value: number; valueLabel?: string }[];
  format?: ValueFormat;
  emptyText?: string;
  /** Scale bars against this instead of the largest value (e.g. 100 for percentages). */
  max?: number;
}) {
  if (items.length === 0) return <p className="py-5 text-center text-sm text-foreground-subtle">{emptyText}</p>;
  const max = fixedMax ?? Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.key}>
          <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
            <span className="min-w-0 truncate">{item.label}</span>
            <span className="shrink-0 font-medium tabular-nums text-gray-900">{item.valueLabel ?? fmt(item.value, format)}</span>
          </div>
          <div className="h-2 rounded-full bg-surface-subtle" aria-hidden="true">
            <div className="h-2 rounded-full bg-primary-600" style={{ width: `${Math.min(100, Math.max(2, (item.value / max) * 100))}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Progress toward a target, with the % as text. */
export function ProgressMeter({ value, label, className }: { value: number; label: string; className?: string }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={cn('space-y-1.5', className)}>
      <ProgressBar value={pct} label={label} size="md" tone={pct >= 100 ? 'success' : 'primary'} />
    </div>
  );
}

/** Compact "recent orders" list used on several role dashboards. */
export interface RecentOrderLike {
  id?: string;
  _id?: string;
  orderNumber?: string;
  status?: string;
  createdAt?: string;
  totals?: { grandTotal?: number };
}

export function RecentOrdersList({
  orders,
  emptyTitle = 'No orders yet',
  emptyDescription,
  emptyAction,
  subtitle,
}: {
  orders: RecentOrderLike[];
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  subtitle?: (o: RecentOrderLike) => ReactNode;
}) {
  if (orders.length === 0) {
    return <EmptyState size="compact" title={emptyTitle} description={emptyDescription} action={emptyAction} />;
  }
  return (
    <ul className="divide-y divide-border">
      {orders.map((order, i) => (
        <li key={order._id || order.id || i} className="flex items-center justify-between gap-3 px-4 py-2.5">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-gray-900">{order.orderNumber || '—'}</p>
            {subtitle && <p className="truncate text-xs text-foreground-subtle">{subtitle(order)}</p>}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-3">
            {order.status && <StatusPill status={order.status} />}
            <span className="text-sm font-semibold tabular-nums text-gray-900">{formatINR(order.totals?.grandTotal ?? 0)}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Small "View all" link for card headers. */
export function ViewAllLink({ to, children = 'View all' }: { to: string; children?: ReactNode }) {
  return (
    <Link to={to} className={buttonClassName({ variant: 'ghost', size: 'sm' })}>
      {children}
    </Link>
  );
}

/** "Tuesday, 22 Sept" — shown under the greeting on every role dashboard. */
export function todayLabel(): string {
  return new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'short' }).format(new Date());
}

export const firstName = (name?: string) => (name || '').split(' ')[0] || 'there';

/** Skeleton for a dashboard card body while its data loads. */
export function CardSkeleton({ rows = 4, label = 'Loading', padded = false }: { rows?: number; label?: string; padded?: boolean }) {
  return (
    <div role="status" aria-label={label} className={cn('space-y-3', padded && 'p-4')}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-10 animate-pulse rounded-lg bg-surface-subtle" />
      ))}
    </div>
  );
}
