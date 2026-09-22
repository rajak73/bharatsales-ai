import type { PillTone } from '../components/ui/StatusPill';

// One colour language for every workflow status, mirroring the web app's
// StatusPill (packages/ui/src/components/badge.tsx STATUS_TONES):
//   success  – done / money received        warning – waiting on someone
//   info     – scheduled / sent             progress – physically on the way
//   danger   – failed, stopped or overdue   neutral  – not started / unknown
// Keys are lower-case with '_' / '-' read as spaces.
const STATUS_TONES: Record<string, PillTone> = {
  // success
  delivered: 'success',
  paid: 'success',
  cleared: 'success',
  verified: 'success',
  completed: 'success',
  achieved: 'success',
  active: 'success',
  resolved: 'success',
  received: 'success',
  'on track': 'success',
  approved: 'success',
  // warning
  submitted: 'warning',
  pending: 'warning',
  'pending approval': 'warning',
  'pending verification': 'warning',
  'hold credit': 'warning',
  'hold stock': 'warning',
  partial: 'warning',
  'partial delivery': 'warning',
  'short delivery': 'warning',
  'at risk': 'warning',
  processing: 'warning',
  'in progress': 'warning',
  'return initiated': 'warning',
  unpaid: 'warning',
  due: 'warning',
  'pending sync': 'warning',
  // info
  sent: 'info',
  scheduled: 'info',
  // progress
  dispatched: 'progress',
  'in transit': 'progress',
  'out for delivery': 'progress',
  shipped: 'progress',
  // danger
  cancelled: 'danger',
  rejected: 'danger',
  bounced: 'danger',
  failed: 'danger',
  overdue: 'danger',
  refused: 'danger',
  'damaged delivery': 'danger',
  missed: 'danger',
  expired: 'danger',
  'sync failed': 'danger',
  // neutral
  draft: 'neutral',
  inactive: 'neutral',
  closed: 'neutral',
};

/** Tone for any status string used in the app. Unknown values → 'neutral'. */
export function statusTone(status?: string | null): PillTone {
  if (!status) return 'neutral';
  return STATUS_TONES[status.toLowerCase().replace(/[_-]+/g, ' ').trim()] ?? 'neutral';
}

export function orderStatusLabel(status?: string): string {
  return (status || '').replace(/_/g, ' ');
}
