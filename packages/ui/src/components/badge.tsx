import * as React from 'react';
import { cn } from '../utils/cn';

export type BadgeTone = 'neutral' | 'primary' | 'info' | 'success' | 'warning' | 'danger' | 'accent' | 'progress';

const SOFT: Record<BadgeTone, string> = {
  neutral: 'bg-gray-100 text-gray-700 ring-gray-200',
  primary: 'bg-primary-50 text-primary-700 ring-primary-200',
  info: 'bg-info-50 text-info-800 ring-info-200',
  success: 'bg-success-50 text-success-800 ring-success-200',
  warning: 'bg-warning-50 text-warning-800 ring-warning-200',
  danger: 'bg-danger-50 text-danger-700 ring-danger-200',
  accent: 'bg-saffron-50 text-saffron-800 ring-saffron-200',
  progress: 'bg-violet-50 text-violet-700 ring-violet-200',
};

const SOLID: Record<BadgeTone, string> = {
  neutral: 'bg-gray-700 text-white ring-gray-700',
  primary: 'bg-primary-600 text-white ring-primary-600',
  info: 'bg-info-700 text-white ring-info-700',
  success: 'bg-success-700 text-white ring-success-700',
  warning: 'bg-warning-500 text-gray-900 ring-warning-500',
  danger: 'bg-danger-600 text-white ring-danger-600',
  accent: 'bg-saffron-500 text-navy-900 ring-saffron-500',
  progress: 'bg-violet-600 text-white ring-violet-600',
};

const DOT: Record<BadgeTone, string> = {
  neutral: 'bg-gray-400',
  primary: 'bg-primary-500',
  info: 'bg-info-500',
  success: 'bg-success-500',
  warning: 'bg-warning-500',
  danger: 'bg-danger-500',
  accent: 'bg-saffron-500',
  progress: 'bg-violet-500',
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  variant?: 'soft' | 'solid' | 'outline';
  size?: 'sm' | 'md';
  /** Small coloured dot before the label. */
  dot?: boolean;
  icon?: React.ReactNode;
}

/** Small label for categories, counts and states. For workflow statuses use <StatusPill>. */
export function Badge({ tone = 'neutral', variant = 'soft', size = 'md', dot, icon, className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-1.5 whitespace-nowrap rounded-full font-medium ring-1 ring-inset',
        size === 'sm' ? 'px-1.5 py-0.5 text-2xs' : 'px-2 py-0 text-xs leading-5',
        variant === 'solid' ? SOLID[tone] : variant === 'outline' ? cn('bg-white', SOFT[tone].split(' ').slice(1).join(' ')) : SOFT[tone],
        '[&_svg]:h-3.5 [&_svg]:w-3.5 [&_svg]:shrink-0',
        className,
      )}
      {...props}
    >
      {dot && <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', variant === 'solid' ? 'bg-current' : DOT[tone])} aria-hidden="true" />}
      {icon}
      <span className="truncate">{children}</span>
    </span>
  );
}

/* ------------------------------------------------------------------------ */
/* Status mapping                                                            */
/* ------------------------------------------------------------------------ */

const norm = (s: string) => s.trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');

/**
 * One colour language for every workflow status in the app (orders,
 * payments/collections, deliveries, returns, approvals, subscriptions,
 * users, targets, jobs). Keys are normalised: case-insensitive, `_`/`-` = space.
 *
 *   success  – approved / done / paid       (Approved, Delivered, Paid, Active…)
 *   warning  – waiting on someone           (Submitted, Pending…, Hold…, Partial…)
 *   info     – moving forward               (Sent, Scheduled, New)
 *   progress – physically on the way        (Dispatched, In Transit, Out for Delivery)
 *   danger   – failed / stopped / overdue   (Rejected, Cancelled, Bounced, Overdue…)
 *   neutral  – not started / archived       (Draft, Inactive, Archived, Closed)
 */
export const STATUS_TONES: Record<string, BadgeTone> = {
  // success
  delivered: 'success',
  paid: 'success',
  cleared: 'success',
  verified: 'success',
  completed: 'success',
  complete: 'success',
  achieved: 'success',
  active: 'success',
  resolved: 'success',
  received: 'success',
  inspected: 'success',
  'on track': 'success',
  success: 'success',
  online: 'success',
  present: 'success',
  'at outlet': 'success',
  // warning — awaiting action
  submitted: 'warning',
  pending: 'warning',
  'pending approval': 'warning',
  'pending verification': 'warning',
  'hold credit': 'warning',
  'hold stock': 'warning',
  'on hold': 'warning',
  partial: 'warning',
  'partially paid': 'warning',
  'partial delivery': 'warning',
  'short delivery': 'warning',
  'at risk': 'warning',
  trial: 'warning',
  'on break': 'warning',
  invited: 'warning',
  queued: 'warning',
  processing: 'warning',
  'in progress': 'warning',
  open: 'warning',
  onboarding: 'warning',
  maintenance: 'warning',
  'return initiated': 'warning',
  unpaid: 'warning',
  due: 'warning',
  away: 'warning',
  approved: 'success',
  // info — scheduled / new
  sent: 'info',
  scheduled: 'info',
  new: 'info',
  // field rep moving between outlets (matches the live-map marker colour)
  traveling: 'primary',
  travelling: 'primary',
  // progress — on the move
  dispatched: 'progress',
  'in transit': 'progress',
  'out for delivery': 'progress',
  shipped: 'progress',
  // danger
  cancelled: 'danger',
  canceled: 'danger',
  rejected: 'danger',
  bounced: 'danger',
  failed: 'danger',
  overdue: 'danger',
  'past due': 'danger',
  suspended: 'danger',
  refused: 'danger',
  'damaged delivery': 'danger',
  missed: 'danger',
  reversed: 'danger',
  expired: 'danger',
  blocked: 'danger',
  absent: 'danger',
  // neutral
  draft: 'neutral',
  inactive: 'neutral',
  archived: 'neutral',
  closed: 'neutral',
  offline: 'neutral',
};

/** Tone for any status string used in the app. Unknown values → 'neutral'. */
export function getStatusTone(status: string | null | undefined): BadgeTone {
  if (!status) return 'neutral';
  return STATUS_TONES[norm(status)] ?? 'neutral';
}

/** "Pending_Approval" → "Pending Approval", "in_transit" → "In Transit". */
export function formatStatusLabel(status: string | null | undefined): string {
  if (!status) return '—';
  return status
    .replace(/[_]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\b([a-z])/g, (m) => m.toUpperCase());
}

export interface StatusPillProps extends Omit<BadgeProps, 'tone' | 'children'> {
  status: string | null | undefined;
  /** Override the mapped tone. */
  tone?: BadgeTone;
  /** Override the displayed text (defaults to the prettified status). */
  label?: React.ReactNode;
}

/** Workflow status with a consistent colour: <StatusPill status={order.status} />. */
export function StatusPill({ status, tone, label, dot = true, ...props }: StatusPillProps) {
  return (
    <Badge tone={tone ?? getStatusTone(status)} dot={dot} {...props}>
      {label ?? formatStatusLabel(status)}
    </Badge>
  );
}
