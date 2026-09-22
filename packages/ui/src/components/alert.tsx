import * as React from 'react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { cn } from '../utils/cn';

export type AlertTone = 'info' | 'success' | 'warning' | 'danger';

const TONES: Record<AlertTone, { box: string; icon: string; Icon: typeof Info }> = {
  info: { box: 'border-primary-200 bg-primary-50 text-primary-900', icon: 'text-primary-600', Icon: Info },
  success: { box: 'border-success-200 bg-success-50 text-success-900', icon: 'text-success-600', Icon: CheckCircle2 },
  warning: { box: 'border-warning-200 bg-warning-50 text-warning-900', icon: 'text-warning-600', Icon: AlertTriangle },
  danger: { box: 'border-danger-200 bg-danger-50 text-danger-900', icon: 'text-danger-600', Icon: XCircle },
};

export interface AlertProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  tone?: AlertTone;
  title?: React.ReactNode;
  /** Shows a close button. */
  onDismiss?: () => void;
  /** Buttons/links shown under the text. */
  actions?: React.ReactNode;
  icon?: React.ReactNode | false;
}

/**
 * Inline, persistent message inside a page or form (e.g. an action failed,
 * KYC pending). For transient feedback after an action, use a toast.
 */
export function Alert({ tone = 'info', title, onDismiss, actions, icon, className, children, ...props }: AlertProps) {
  const t = TONES[tone];
  const Icon = t.Icon;
  return (
    <div
      role={tone === 'danger' || tone === 'warning' ? 'alert' : 'status'}
      className={cn('flex gap-3 rounded-xl border p-3 text-sm sm:p-4', t.box, className)}
      {...props}
    >
      {icon !== false && <span className={cn('mt-0.5 shrink-0 [&_svg]:h-5 [&_svg]:w-5', t.icon)} aria-hidden="true">{icon ?? <Icon />}</span>}
      <div className="min-w-0 flex-1 space-y-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className="leading-relaxed opacity-90">{children}</div>}
        {actions && <div className="flex flex-wrap gap-2 pt-2">{actions}</div>}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="-m-1.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md opacity-70 hover:bg-black/5 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
