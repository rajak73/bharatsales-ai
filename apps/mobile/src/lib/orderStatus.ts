import type { PillTone } from '../components/ui/StatusPill';

// Shared by the Rep and Distributor Orders screens (previously each had its
// own copy of this exact status->color map).
export const ORDER_STATUS_TONE: Record<string, PillTone> = {
  Draft: 'neutral',
  Submitted: 'warning',
  Pending_Approval: 'warning',
  Hold_Credit: 'danger',
  Hold_Stock: 'danger',
  Approved: 'primary',
  Dispatched: 'primary',
  Delivered: 'success',
  Partial_Delivery: 'primary',
  Cancelled: 'neutral',
  Rejected: 'danger',
};

export function orderStatusLabel(status?: string): string {
  return (status || '').replace(/_/g, ' ');
}
