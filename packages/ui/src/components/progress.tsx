import * as React from 'react';
import { cn } from '../utils/cn';
import { formatPercent } from '../utils/format';

export type ProgressTone = 'primary' | 'success' | 'warning' | 'danger' | 'neutral';

const TONE_CLASSES: Record<ProgressTone, string> = {
  primary: 'bg-primary-600',
  success: 'bg-success-500',
  warning: 'bg-warning-500',
  danger: 'bg-danger-500',
  neutral: 'bg-gray-400',
};

const SIZE_CLASSES = { xs: 'h-1.5', sm: 'h-2', md: 'h-2.5' } as const;

export interface ProgressBarProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Current value, clamped to 0…max. */
  value: number;
  max?: number;
  /** Accessible name, e.g. "Target achievement for Ravi". Required unless the bar is decorative. */
  label?: string;
  tone?: ProgressTone;
  size?: keyof typeof SIZE_CLASSES;
  /** Shows the % next to the bar (unclamped, so 120% reads as 120%). */
  showValue?: boolean;
  /** Hides the bar from assistive tech when the value is already stated in text next to it. */
  decorative?: boolean;
}

/**
 * Horizontal progress / achievement bar. Pick the tone at the call site
 * (e.g. `toneForPercent(pct)`) so each page keeps its own thresholds.
 */
export function ProgressBar({
  value,
  max = 100,
  label,
  tone = 'primary',
  size = 'sm',
  showValue = false,
  decorative = false,
  className,
  ...props
}: ProgressBarProps) {
  const safeMax = max > 0 ? max : 100;
  const rawPct = ((Number(value) || 0) / safeMax) * 100;
  const pct = Math.max(0, Math.min(100, rawPct));
  const bar = (
    <div
      className={cn('w-full overflow-hidden rounded-full bg-surface-subtle', SIZE_CLASSES[size], showValue ? 'flex-1' : className)}
      {...(decorative
        ? { 'aria-hidden': true }
        : { role: 'progressbar', 'aria-label': label, 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': Math.round(pct) })}
      {...(showValue ? {} : props)}
    >
      <div
        className={cn('h-full rounded-full transition-[width] duration-300 motion-reduce:transition-none', TONE_CLASSES[tone])}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
  if (!showValue) return bar;
  return (
    <div className={cn('flex items-center gap-2', className)} {...props}>
      {bar}
      <span className="w-11 shrink-0 text-right text-xs font-medium tabular-nums text-gray-900">{formatPercent(rawPct, { decimals: 0 })}</span>
    </div>
  );
}

/** Default traffic-light tone for an achievement %: ≥ good → success, ≥ ok → warning, else danger. */
export function toneForPercent(pct: number, { good = 75, ok = 50 }: { good?: number; ok?: number } = {}): ProgressTone {
  if (pct >= good) return 'success';
  if (pct >= ok) return 'warning';
  return 'danger';
}
