import { forwardRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, IndianRupee, MapPin, WifiOff } from 'lucide-react';
import { Card, Input, cn, type InputProps } from '@bharatsales/ui';
import { BrandLogo } from './brand';

/*
 * Shared building blocks for the public auth screens (login, signup,
 * password reset, invite, verify email, device verify). Local to the
 * public pages.
 */

const AUTH_POINTS: { icon: ReactNode; title: string; desc: string }[] = [
  { icon: <WifiOff />, title: 'Orders without network', desc: 'Reps book orders offline on rural beats; everything syncs later.' },
  { icon: <MapPin />, title: 'Every visit on the map', desc: 'GPS check-ins at each outlet and a live team map for managers.' },
  { icon: <IndianRupee />, title: 'Collections you can see', desc: 'Outlet dues, credit limits and GST on every order.' },
];

/** Navy brand panel shown beside the form on desktop. Decorative copy only. */
function AuthBrandPanel() {
  return (
    <aside className="relative hidden overflow-hidden bg-navy-900 text-white lg:flex lg:flex-col">
      <div className="relative flex flex-1 flex-col px-10 py-8 xl:px-14">
        <BrandLogo tone="light" />
        <div className="my-auto max-w-md py-10">
          <p className="text-xs font-semibold uppercase tracking-wider text-saffron-400">Sales force automation for India</p>
          <p className="mt-2 font-display text-3xl font-extrabold leading-tight tracking-tight">
            Har outlet, har order, har rep — ek app mein.
          </p>
          <ul className="mt-6 space-y-4">
            {AUTH_POINTS.map((p) => (
              <li key={p.title} className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-saffron-400 [&_svg]:h-[18px] [&_svg]:w-[18px]"
                >
                  {p.icon}
                </span>
                <span>
                  <span className="block font-display text-sm font-bold text-white">{p.title}</span>
                  <span className="block text-sm leading-snug text-navy-200">{p.desc}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-navy-300">Made in India, for Indian distribution.</p>
      </div>
    </aside>
  );
}

/**
 * Split auth layout: navy brand panel on the left (desktop only) and a compact
 * white form card on the right. Single column with a slim navy top bar on phones.
 */
export function AuthLayout({
  title,
  description,
  icon,
  children,
  footer,
  width = 'md',
}: {
  title?: ReactNode;
  description?: ReactNode;
  /** Optional icon tile shown above the title. */
  icon?: ReactNode;
  children: ReactNode;
  /** Links shown under the card ("Already have an account? Sign in"). */
  footer?: ReactNode;
  width?: 'md' | 'lg';
}) {
  return (
    <div className="grid min-h-screen overflow-x-hidden bg-background lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <AuthBrandPanel />

      <div className="flex min-h-screen min-w-0 flex-col">
        {/* Phones / tablets: slim navy bar with the logo */}
        <header className="flex h-14 items-center bg-navy-900 px-4 sm:px-5 lg:hidden">
          <BrandLogo tone="light" />
        </header>

        <main id="main-content" className="flex flex-1 items-start justify-center px-4 py-6 sm:items-center sm:px-5 sm:py-10">
          <div className={cn('w-full', width === 'lg' ? 'max-w-lg' : 'max-w-md')}>
            <Card className="p-5 sm:p-6">
              {(icon || title || description) && (
                <div className="mb-5">
                  {icon && (
                    <div
                      aria-hidden="true"
                      className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600 [&_svg]:h-5 [&_svg]:w-5"
                    >
                      {icon}
                    </div>
                  )}
                  {title && <h1 className="font-display text-xl font-bold tracking-tight text-navy-900 sm:text-2xl">{title}</h1>}
                  {description && <p className="mt-1 text-sm leading-relaxed text-foreground-muted">{description}</p>}
                </div>
              )}
              {children}
            </Card>
            {footer && <div className="mt-4 space-y-1.5 text-center text-sm text-foreground-muted">{footer}</div>}
          </div>
        </main>

        <footer className="px-4 pb-4 text-center text-xs text-foreground-muted">
          © 2026 BharatSales AI ·{' '}
          <Link to="/terms" className="hover:text-gray-800 hover:underline">
            Terms
          </Link>{' '}
          ·{' '}
          <Link to="/privacy" className="hover:text-gray-800 hover:underline">
            Privacy
          </Link>
        </footer>
      </div>
    </div>
  );
}

/** Success / failure / progress panel shown inside the auth card after an action. */
export function ResultState({
  tone,
  icon,
  title,
  children,
  actions,
}: {
  tone: 'success' | 'danger' | 'progress';
  icon: ReactNode;
  title: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
}) {
  const toneClass = {
    success: 'bg-success-50 text-success-600',
    danger: 'bg-danger-50 text-danger-600',
    progress: 'bg-primary-50 text-primary-600',
  }[tone];
  return (
    <div className="py-2 text-center" role={tone === 'danger' ? 'alert' : 'status'}>
      <div aria-hidden="true" className={cn('mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full [&_svg]:h-6 [&_svg]:w-6', toneClass)}>
        {icon}
      </div>
      <h1 className="font-display text-xl font-bold tracking-tight text-navy-900">{title}</h1>
      {children && <div className="mt-2 text-sm leading-relaxed text-foreground-muted">{children}</div>}
      {actions && <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">{actions}</div>}
    </div>
  );
}

/** Password field with a show/hide toggle. Same props as <Input>. */
export const PasswordInput = forwardRef<HTMLInputElement, Omit<InputProps, 'type' | 'rightElement'>>((props, ref) => {
  const [visible, setVisible] = useState(false);
  return (
    <Input
      ref={ref}
      {...props}
      type={visible ? 'text' : 'password'}
      rightElement={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          className="flex h-9 w-9 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        >
          {visible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
        </button>
      }
    />
  );
});
PasswordInput.displayName = 'PasswordInput';

/** Live checklist of password rules (purely visual; pages keep their own validation). */
export function PasswordChecklist({ rules }: { rules: { label: string; met: boolean }[] }) {
  return (
    <ul className="grid gap-1.5 text-xs sm:grid-cols-2" aria-label="Password requirements">
      {rules.map((r) => (
        <li key={r.label} className={cn('flex items-center gap-2', r.met ? 'text-success-700' : 'text-foreground-subtle')}>
          <span
            aria-hidden="true"
            className={cn('flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold', r.met ? 'bg-success-100' : 'bg-gray-100')}
          >
            {r.met ? '✓' : ''}
          </span>
          {r.label}
          <span className="sr-only">{r.met ? '(done)' : '(not yet)'}</span>
        </li>
      ))}
    </ul>
  );
}
