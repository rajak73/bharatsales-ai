import * as React from 'react';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { cn } from '../utils/cn';
import { Skeleton } from './skeleton';

export type StatTone = 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const ICON_TONES: Record<StatTone, string> = {
  primary: 'bg-primary-50 text-primary-600',
  accent: 'bg-saffron-100 text-saffron-700',
  success: 'bg-success-50 text-success-600',
  warning: 'bg-warning-50 text-warning-600',
  danger: 'bg-danger-50 text-danger-600',
  info: 'bg-info-50 text-info-600',
  neutral: 'bg-gray-100 text-gray-600',
};

export interface StatDelta {
  /** Numeric change in percent (12.5 → "+12.5%") or a preformatted string. */
  value: number | string;
  /** Inferred from the sign of a numeric value when omitted. */
  direction?: 'up' | 'down' | 'flat';
  /** Set false when "up" is bad (e.g. overdue amount, returns). Default true. */
  positiveIsGood?: boolean;
  /** Context, e.g. "vs last month". */
  label?: string;
}

export interface StatCardProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title' | 'onClick'> {
  label: React.ReactNode;
  /** Already formatted value — use formatINR / formatNumber. */
  value: React.ReactNode;
  icon?: React.ReactNode;
  tone?: StatTone;
  delta?: StatDelta;
  /** Small secondary line under the value (e.g. "12 pending approval"). */
  hint?: React.ReactNode;
  loading?: boolean;
  /** Makes the whole card a button. */
  onClick?: () => void;
}

const isPlainText = (n: React.ReactNode): n is string | number => typeof n === 'string' || typeof n === 'number';

/** KPI tile: label, big value, optional icon, delta and hint. Put 2–4 in a responsive grid. */
export function StatCard({ label, value, icon, tone = 'primary', delta, hint, loading, onClick, className, ...props }: StatCardProps) {
  const direction =
    delta?.direction ?? (typeof delta?.value === 'number' ? (delta.value > 0 ? 'up' : delta.value < 0 ? 'down' : 'flat') : 'flat');
  const good = delta?.positiveIsGood === false ? direction === 'down' : direction === 'up';
  const deltaColor = direction === 'flat' ? 'text-gray-600 bg-gray-100' : good ? 'text-success-700 bg-success-50' : 'text-danger-700 bg-danger-50';
  const DeltaIcon = direction === 'up' ? ArrowUpRight : direction === 'down' ? ArrowDownRight : Minus;
  const deltaText =
    typeof delta?.value === 'number' ? `${delta.value > 0 ? '+' : ''}${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 1 }).format(delta.value)}%` : delta?.value;

  // A hint that merely repeats the value (e.g. "₹0" under "₹0") adds noise, not context.
  const showHint = hint != null && hint !== false && hint !== '' && !(isPlainText(hint) && isPlainText(value) && String(hint).trim() === String(value).trim());

  const Comp = (onClick ? 'button' : 'div') as unknown as React.ComponentType<React.HTMLAttributes<HTMLElement> & { type?: 'button' }>;

  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'flex w-full flex-col rounded-xl border border-border bg-white p-3 text-left shadow-soft sm:px-4 sm:py-3.5',
        onClick && 'transition-colors hover:border-primary-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
        className,
      )}
      aria-busy={loading || undefined}
      {...props}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-foreground-muted sm:text-sm">{label}</p>
        {icon && (
          <span className={cn('-my-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md [&_svg]:h-4 [&_svg]:w-4', ICON_TONES[tone])} aria-hidden="true">
            {icon}
          </span>
        )}
      </div>
      {loading ? (
        <div className="mt-1.5 space-y-1.5">
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-4 w-20" />
          <span className="sr-only">Loading</span>
        </div>
      ) : (
        <>
          <p className="mt-0.5 truncate font-display text-xl font-bold tracking-tight text-gray-900 tabular-nums sm:text-2xl">{value}</p>
          {(delta || showHint) && (
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
              {delta && (
                <span className={cn('inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-semibold tabular-nums', deltaColor)}>
                  <DeltaIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="sr-only">{direction === 'up' ? 'Up' : direction === 'down' ? 'Down' : 'No change'}</span>
                  {deltaText}
                </span>
              )}
              {delta?.label && <span className="text-foreground-subtle">{delta.label}</span>}
              {showHint && <span className="text-foreground-subtle">{hint}</span>}
            </div>
          )}
        </>
      )}
    </Comp>
  );
}

/** Responsive grid for StatCards: 2 cols on phones → `columns` from lg up. */
export function StatGrid({ columns = 4, className, children }: { columns?: 2 | 3 | 4 | 5; className?: string; children: React.ReactNode }) {
  const lg = { 2: 'lg:grid-cols-2', 3: 'lg:grid-cols-3', 4: 'lg:grid-cols-4', 5: 'lg:grid-cols-5' }[columns];
  return <div className={cn('grid grid-cols-2 gap-3', lg, className)}>{children}</div>;
}
