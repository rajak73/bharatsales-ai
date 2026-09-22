import * as React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { cn } from '../utils/cn';

export type ToastTone = 'success' | 'error' | 'info' | 'warning';

export interface ToastOptions {
  title: React.ReactNode;
  description?: React.ReactNode;
  tone?: ToastTone;
  /** ms before auto-dismiss. Default 4000 (errors 7000). 0 = stay until closed. */
  duration?: number;
  /** Optional single action, e.g. { label: 'Undo', onClick }. */
  action?: { label: string; onClick: () => void };
}

interface ToastItem extends ToastOptions {
  id: number;
}

type ToastInput = string | Omit<ToastOptions, 'tone'>;

export interface ToastApi {
  /** Generic toast. Returns its id. */
  toast: (options: ToastOptions) => number;
  success: (input: ToastInput) => number;
  error: (input: ToastInput) => number;
  info: (input: ToastInput) => number;
  warning: (input: ToastInput) => number;
  dismiss: (id?: number) => void;
}

const ToastContext = React.createContext<ToastApi | null>(null);

const MAX_VISIBLE = 4;

const TONE: Record<ToastTone, { icon: typeof Info; iconClass: string }> = {
  success: { icon: CheckCircle2, iconClass: 'text-success-600' },
  error: { icon: XCircle, iconClass: 'text-danger-600' },
  info: { icon: Info, iconClass: 'text-primary-600' },
  warning: { icon: AlertTriangle, iconClass: 'text-warning-600' },
};

/** Mount once near the root (UIProvider does this). Then call useToast() anywhere. */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);
  const idRef = React.useRef(0);
  const timers = React.useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = React.useCallback((id?: number) => {
    setToasts((list) => (id === undefined ? [] : list.filter((t) => t.id !== id)));
    if (id === undefined) {
      timers.current.forEach(clearTimeout);
      timers.current.clear();
    } else {
      const t = timers.current.get(id);
      if (t) clearTimeout(t);
      timers.current.delete(id);
    }
  }, []);

  const toast = React.useCallback(
    (options: ToastOptions) => {
      const id = ++idRef.current;
      const tone = options.tone ?? 'info';
      const duration = options.duration ?? (tone === 'error' ? 7000 : 4000);
      setToasts((list) => [...list, { ...options, tone, id }].slice(-MAX_VISIBLE));
      if (duration > 0) {
        timers.current.set(
          id,
          setTimeout(() => dismiss(id), duration),
        );
      }
      return id;
    },
    [dismiss],
  );

  React.useEffect(() => {
    const map = timers.current;
    return () => map.forEach(clearTimeout);
  }, []);

  const api = React.useMemo<ToastApi>(() => {
    const make = (tone: ToastTone) => (input: ToastInput) => toast(typeof input === 'string' ? { title: input, tone } : { ...input, tone });
    return { toast, dismiss, success: make('success'), error: make('error'), info: make('info'), warning: make('warning') };
  }, [toast, dismiss]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      {typeof document !== 'undefined' &&
        createPortal(
          <div
            aria-live="polite"
            aria-relevant="additions"
            className="pointer-events-none fixed inset-x-0 bottom-0 z-toast flex flex-col items-center gap-2 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:bottom-auto sm:left-auto sm:right-0 sm:top-0 sm:items-end sm:p-6"
          >
            {toasts.map((t) => {
              const tone = TONE[t.tone ?? 'info'];
              const Icon = tone.icon;
              return (
                <div
                  key={t.id}
                  role={t.tone === 'error' ? 'alert' : 'status'}
                  className="pointer-events-auto flex w-full max-w-sm animate-slide-up items-start gap-3 rounded-xl border border-border bg-white p-4 shadow-overlay motion-reduce:animate-none"
                >
                  <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', tone.iconClass)} aria-hidden="true" />
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="font-medium text-gray-900">{t.title}</p>
                    {t.description && <p className="mt-0.5 text-foreground-subtle">{t.description}</p>}
                    {t.action && (
                      <button
                        type="button"
                        onClick={() => {
                          t.action!.onClick();
                          dismiss(t.id);
                        }}
                        className="mt-2 rounded font-semibold text-primary-700 hover:text-primary-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                      >
                        {t.action.label}
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => dismiss(t.id)}
                    aria-label="Dismiss notification"
                    className="-m-1.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  );
}

/** const toast = useToast(); toast.success('Order approved'); toast.error(getErrorMessage(err)). */
export function useToast(): ToastApi {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error('useToast() must be used inside <ToastProvider> (or <UIProvider>)');
  return ctx;
}
