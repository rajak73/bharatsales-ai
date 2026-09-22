import * as React from 'react';
import { Inbox } from 'lucide-react';
import { cn } from '../utils/cn';

export interface EmptyStateProps {
  /** Icon element, e.g. <ShoppingCart />. Defaults to an inbox. */
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Primary call to action (a Button). */
  action?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  /** compact: for inside tables/cards; default: for a whole page section. */
  size?: 'compact' | 'default';
  /** Draw a dashed border box (standalone use, outside a Card). */
  bordered?: boolean;
  className?: string;
}

/**
 * What to show when a list has nothing in it. Say what is missing and what
 * to do next: "No orders yet" + "Orders placed by your reps appear here."
 */
export function EmptyState({ icon, title, description, action, secondaryAction, size = 'default', bordered, className }: EmptyStateProps) {
  const compact = size === 'compact';
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center px-4 text-center',
        compact ? 'py-6' : 'py-8 sm:py-10',
        bordered && 'rounded-xl border border-dashed border-border-strong bg-white',
        className,
      )}
    >
      <div
        className={cn(
          'mb-3 flex items-center justify-center rounded-full bg-primary-50 text-primary-600',
          compact ? 'h-10 w-10 [&_svg]:h-5 [&_svg]:w-5' : 'h-12 w-12 [&_svg]:h-6 [&_svg]:w-6',
        )}
        aria-hidden="true"
      >
        {icon ?? <Inbox />}
      </div>
      <h3 className="font-display text-sm font-semibold text-gray-900 sm:text-base">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-foreground-subtle">{description}</p>}
      {(action || secondaryAction) && (
        <div className="mt-3 flex flex-col-reverse items-center gap-2 sm:flex-row">
          {secondaryAction}
          {action}
        </div>
      )}
    </div>
  );
}
