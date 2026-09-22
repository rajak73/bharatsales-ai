import * as React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '../utils/cn';
import { useEscapeKey, useFocusTrap, useLockBodyScroll } from '../hooks';
import { Button } from './button';

function Portal({ children }: { children: React.ReactNode }) {
  if (typeof document === 'undefined') return null;
  return createPortal(children, document.body);
}

const MODAL_SIZES = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
  xl: 'sm:max-w-4xl',
};

export interface ModalProps {
  open: boolean;
  /** Called on Esc, overlay click and the close button. */
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Footer actions, right-aligned (Cancel first, primary last). Stacks full-width on mobile. */
  footer?: React.ReactNode;
  size?: keyof typeof MODAL_SIZES;
  /** Set false while saving so the dialog can't be dismissed mid-request. Default true. */
  dismissible?: boolean;
  /** Close when the backdrop is clicked. Default true (forms with unsaved input may pass false). */
  closeOnOverlayClick?: boolean;
  hideCloseButton?: boolean;
  /** Extra classes on the scrollable body. */
  bodyClassName?: string;
  className?: string;
  /** role="alertdialog" for confirmations. */
  role?: 'dialog' | 'alertdialog';
  children?: React.ReactNode;
}

/**
 * Accessible dialog: portal, focus trap, Esc to close, aria-modal, scroll
 * lock, focus restored on close. Bottom sheet on phones, centred on ≥sm.
 * Put `data-autofocus` on the element that should receive focus first.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  footer,
  size = 'md',
  dismissible = true,
  closeOnOverlayClick = true,
  hideCloseButton,
  bodyClassName,
  className,
  role = 'dialog',
  children,
}: ModalProps) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  const titleId = React.useId();
  const descId = React.useId();
  useFocusTrap(panelRef, open);
  useLockBodyScroll(open);
  useEscapeKey(() => dismissible && onClose(), open);

  if (!open) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-overlay flex items-end justify-center sm:items-center sm:p-4">
        <div
          className="absolute inset-0 animate-fade-in bg-gray-900/50 motion-reduce:animate-none"
          aria-hidden="true"
          onClick={() => dismissible && closeOnOverlayClick && onClose()}
        />
        <div
          ref={panelRef}
          role={role}
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={description ? descId : undefined}
          tabIndex={-1}
          className={cn(
            'relative flex max-h-[92dvh] w-full flex-col rounded-t-2xl bg-white shadow-overlay outline-none sm:max-h-[85vh] sm:rounded-xl',
            'animate-slide-up sm:animate-scale-in motion-reduce:animate-none',
            MODAL_SIZES[size],
            className,
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-border px-4 py-3 sm:px-5">
            <div className="min-w-0">
              <h2 id={titleId} className="font-display text-base font-semibold text-gray-900 sm:text-[1.0625rem]">
                {title}
              </h2>
              {description && (
                <p id={descId} className="mt-0.5 text-sm text-foreground-subtle">
                  {description}
                </p>
              )}
            </div>
            {!hideCloseButton && (
              <button
                type="button"
                onClick={onClose}
                disabled={!dismissible}
                aria-label="Close"
                className="-mr-2 -mt-1 flex h-10 w-10 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:opacity-40"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
          <div className={cn('flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5', bodyClassName)}>{children}</div>
          {footer && (
            <div className="flex flex-col-reverse gap-2 border-t border-border px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end sm:px-5 sm:pb-3 [&>*]:w-full sm:[&>*]:w-auto">
              {footer}
            </div>
          )}
        </div>
      </div>
    </Portal>
  );
}

/* ------------------------------------------------------------------------ */
/* ConfirmDialog                                                             */
/* ------------------------------------------------------------------------ */

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  /** May return a promise — the confirm button shows a spinner until it settles. */
  onConfirm: () => void | Promise<unknown>;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Action verb, e.g. "Cancel order", "Delete product". Avoid "OK"/"Yes". */
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'primary';
  /** Controlled loading state (otherwise derived from the onConfirm promise). */
  loading?: boolean;
  /** Extra content, e.g. a "Reason" textarea. */
  children?: React.ReactNode;
}

/** "Are you sure?" dialog. Replaces window.confirm(). Use tone="danger" for irreversible actions. */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'primary',
  loading,
  children,
}: ConfirmDialogProps) {
  const [pending, setPending] = React.useState(false);
  const busy = loading ?? pending;

  React.useEffect(() => {
    if (!open) setPending(false);
  }, [open]);

  const handleConfirm = async () => {
    const result = onConfirm();
    if (result && typeof (result as Promise<unknown>).then === 'function') {
      setPending(true);
      try {
        await result;
      } finally {
        setPending(false);
      }
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      role="alertdialog"
      size="sm"
      dismissible={!busy}
      title={
        <span className="flex items-center gap-3">
          {tone === 'danger' && (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-danger-50 text-danger-600" aria-hidden="true">
              <AlertTriangle className="h-5 w-5" />
            </span>
          )}
          {title}
        </span>
      }
      hideCloseButton
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy} data-autofocus>
            {cancelLabel}
          </Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={handleConfirm} loading={busy}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {description && <div className="text-sm leading-relaxed text-foreground-muted">{description}</div>}
      {children && <div className={cn(description && 'mt-3')}>{children}</div>}
    </Modal>
  );
}

/* ------------------------------------------------------------------------ */
/* Drawer / Sheet                                                            */
/* ------------------------------------------------------------------------ */

const DRAWER_SIZES = { sm: 'sm:max-w-sm', md: 'sm:max-w-md', lg: 'sm:max-w-xl', xl: 'sm:max-w-3xl' };

export interface DrawerProps extends Omit<ModalProps, 'size' | 'role'> {
  side?: 'right' | 'left';
  size?: keyof typeof DRAWER_SIZES;
}

/**
 * Side panel for details and longer forms (order detail, edit outlet).
 * Full-width on phones. Same a11y behaviour as Modal.
 */
export function Drawer({
  open,
  onClose,
  title,
  description,
  footer,
  side = 'right',
  size = 'md',
  dismissible = true,
  closeOnOverlayClick = true,
  hideCloseButton,
  bodyClassName,
  className,
  children,
}: DrawerProps) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  const titleId = React.useId();
  const descId = React.useId();
  useFocusTrap(panelRef, open);
  useLockBodyScroll(open);
  useEscapeKey(() => dismissible && onClose(), open);

  if (!open) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-overlay">
        <div
          className="absolute inset-0 animate-fade-in bg-gray-900/50 motion-reduce:animate-none"
          aria-hidden="true"
          onClick={() => dismissible && closeOnOverlayClick && onClose()}
        />
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={description ? descId : undefined}
          tabIndex={-1}
          className={cn(
            'absolute inset-y-0 flex w-full flex-col bg-white shadow-overlay outline-none motion-reduce:animate-none',
            side === 'right' ? 'right-0 animate-slide-in-right' : 'left-0 animate-slide-in-left',
            DRAWER_SIZES[size],
            className,
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-border px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-5">
            <div className="min-w-0">
              <h2 id={titleId} className="font-display text-base font-semibold text-gray-900 sm:text-[1.0625rem]">
                {title}
              </h2>
              {description && (
                <p id={descId} className="mt-0.5 text-sm text-foreground-subtle">
                  {description}
                </p>
              )}
            </div>
            {!hideCloseButton && (
              <button
                type="button"
                onClick={onClose}
                disabled={!dismissible}
                aria-label="Close"
                className="-mr-2 -mt-1 flex h-10 w-10 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:opacity-40"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
          <div className={cn('flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5', bodyClassName)}>{children}</div>
          {footer && (
            <div className="flex flex-col-reverse gap-2 border-t border-border px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end sm:px-5 [&>*]:w-full sm:[&>*]:w-auto">
              {footer}
            </div>
          )}
        </div>
      </div>
    </Portal>
  );
}
