import { useEffect, useState, type ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Mail, Menu, MessageCircle } from 'lucide-react';
import { Drawer, IconButton, buttonClassName, cn } from '@bharatsales/ui';
import { BrandLogo } from './brand';

/*
 * Shared chrome for the public marketing pages (/, /features, /industries,
 * /pricing, /contact, /terms, /privacy): sticky top nav, footer, CTA band,
 * floating WhatsApp button, screenshot frames and section helpers. Local to
 * the public pages; the dashboard has its own layout.
 */

/** Public contact channels. Both come from build-time env; unset = not shown anywhere. */
export const CONTACT_EMAIL: string = String(import.meta.env.VITE_CONTACT_EMAIL ?? '').trim();
export const WHATSAPP_DIGITS: string = String(import.meta.env.VITE_WHATSAPP_NUMBER ?? '').replace(/\D/g, '');

/** Signed Android build of the field app (GitHub release asset). */
export const ANDROID_APK_URL = 'https://github.com/rajak73/bharatsales-ai/releases/download/v1.0.4-android/BharatSales-AI-v1.0.4.apk';

const NAV_LINKS = [
  { to: '/features', label: 'Features' },
  { to: '/industries', label: 'Industries' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/contact', label: 'Contact' },
];

/** Max width + gutters used by every marketing section (16px phones, 20–24px desktop). */
export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('mx-auto w-full max-w-6xl px-4 sm:px-5 lg:px-6', className)}>{children}</div>;
}

/** White outline button for navy backgrounds (pairs with the saffron CTA). */
export const onNavyOutline = 'border border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white active:bg-white/15 focus-visible:ring-saffron-400 focus-visible:ring-offset-navy-900';

export function MarketingNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const close = () => setMenuOpen(false);

  // Soft shadow once the page has scrolled, so the bar reads as floating above content.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-header border-b bg-white transition-shadow duration-200 motion-reduce:transition-none',
        scrolled ? 'border-border shadow-overlay' : 'border-transparent shadow-none',
      )}
    >
      <Container className="flex h-14 items-center justify-between gap-3 sm:h-[60px]">
        <BrandLogo />

        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-0.5">
            {NAV_LINKS.map((l) => (
              <li key={l.to}>
                <NavLink
                  to={l.to}
                  className={({ isActive }) =>
                    cn(
                      'rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-background hover:text-navy-900',
                      isActive ? 'text-primary-700' : 'text-foreground-muted',
                    )
                  }
                >
                  {l.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-1.5">
          <Link to="/login" className={buttonClassName({ variant: 'ghost', className: 'hidden sm:inline-flex' })}>
            Log in
          </Link>
          <Link to="/contact" className={buttonClassName({ variant: 'primary', size: 'sm', className: 'sm:h-9 sm:px-3.5 sm:text-sm' })}>
            Book a Demo
          </Link>
          <IconButton aria-label="Open menu" aria-expanded={menuOpen} icon={<Menu />} className="md:hidden" onClick={() => setMenuOpen(true)} />
        </div>
      </Container>

      <Drawer open={menuOpen} onClose={close} title="Menu" size="sm">
        <nav aria-label="Main">
          <ul className="space-y-0.5">
            {NAV_LINKS.map((l) => (
              <li key={l.to}>
                <NavLink
                  to={l.to}
                  onClick={close}
                  className={({ isActive }) =>
                    cn(
                      'flex min-h-[44px] items-center rounded-lg px-3 text-base font-medium hover:bg-background',
                      isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-800',
                    )
                  }
                >
                  {l.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-4 grid gap-2 border-t border-border pt-4">
          <Link to="/contact" onClick={close} className={buttonClassName({ variant: 'primary', fullWidth: true })}>
            Book a Demo
          </Link>
          <Link to="/login" onClick={close} className={buttonClassName({ variant: 'outline', fullWidth: true })}>
            Log in
          </Link>
        </div>
      </Drawer>
    </header>
  );
}

type FooterLink = { label: string; to?: string; href?: string };

const FOOTER_COLUMNS: { title: string; links: FooterLink[] }[] = [
  {
    title: 'Product',
    links: [
      { to: '/features', label: 'Features' },
      { to: '/industries', label: 'Industries' },
      { to: '/pricing', label: 'Pricing' },
      { href: ANDROID_APK_URL, label: 'Android app' },
    ],
  },
  {
    title: 'Company',
    links: [
      { to: '/contact', label: 'Contact & demo' },
      { to: '/login', label: 'Log in' },
      { to: '/signup', label: 'Create an account' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { to: '/terms', label: 'Terms of service' },
      { to: '/privacy', label: 'Privacy policy' },
    ],
  },
];

const footerLinkClass = 'rounded transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron-400';

export function MarketingFooter() {
  return (
    <footer className="bg-navy-950 text-navy-200">
      <Container className="py-8 sm:py-10">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
          <div className="col-span-2 sm:col-span-3 lg:col-span-2">
            <BrandLogo tone="light" />
            <p className="mt-3 max-w-xs text-sm leading-relaxed">
              Field sales and distributor management for Indian FMCG &amp; pharma distribution: a web dashboard plus an Android app that works offline.
            </p>
            {(CONTACT_EMAIL || WHATSAPP_DIGITS) && (
              <ul className="mt-4 space-y-1.5 text-sm">
                {CONTACT_EMAIL && (
                  <li className="flex items-center gap-2">
                    <Mail className="h-4 w-4 shrink-0 text-navy-300" aria-hidden="true" />
                    <a href={`mailto:${CONTACT_EMAIL}`} className={footerLinkClass}>
                      {CONTACT_EMAIL}
                    </a>
                  </li>
                )}
                {WHATSAPP_DIGITS && (
                  <li className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 shrink-0 text-navy-300" aria-hidden="true" />
                    <a href={`https://wa.me/${WHATSAPP_DIGITS}`} target="_blank" rel="noopener noreferrer" className={footerLinkClass}>
                      WhatsApp us
                    </a>
                  </li>
                )}
              </ul>
            )}
          </div>
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title}>
              <h2 className="font-display text-sm font-semibold text-white">{col.title}</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {col.links.map((l) => (
                  <li key={l.label}>
                    {l.to ? (
                      <Link to={l.to} className={footerLinkClass}>
                        {l.label}
                      </Link>
                    ) : (
                      <a href={l.href} className={footerLinkClass}>
                        {l.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-col gap-1 border-t border-white/10 pt-4 text-xs text-navy-300 sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 BharatSales AI. All rights reserved.</span>
          <span>Made in India, for Indian distribution.</span>
        </div>
      </Container>
    </footer>
  );
}

/** Floating WhatsApp chat button. Renders nothing unless VITE_WHATSAPP_NUMBER is set. */
export function WhatsAppButton() {
  const digits = WHATSAPP_DIGITS;
  if (!digits) return null;
  return (
    <a
      href={`https://wa.me/${digits}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp (opens in a new tab)"
      title="Chat on WhatsApp"
      className="fixed bottom-4 right-4 z-header flex h-12 w-12 items-center justify-center rounded-full bg-success-600 text-white shadow-overlay transition-colors hover:bg-success-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success-500 focus-visible:ring-offset-2 sm:bottom-5 sm:right-5"
    >
      <MessageCircle className="h-6 w-6" aria-hidden="true" />
    </a>
  );
}

/** Page shell for marketing pages: skip link, nav, <main>, footer. */
export function MarketingLayout({ children, className }: { children: ReactNode; className?: string }) {
  // overflow-x-clip (not -hidden): -hidden turns this wrapper into a scroll
  // container, which silently stops the sticky top bar from sticking.
  return (
    <div className="flex min-h-screen flex-col overflow-x-clip bg-white">
      <a
        href="#main-content"
        className="sr-only z-toast rounded-lg bg-white px-4 py-2 text-sm font-medium text-primary-700 shadow-overlay focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <MarketingNav />
      <main id="main-content" className={cn('flex-1', className)}>
        {children}
      </main>
      <MarketingFooter />
      <WhatsAppButton />
    </div>
  );
}

/** Compact light intro band at the top of the inner marketing pages (pricing, features, …). */
export function PageIntro({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section className={cn('border-b border-border bg-background py-8 sm:py-10', className)}>
      <Container>{children}</Container>
    </section>
  );
}

/** Eyebrow + heading + intro used at the top of each marketing section. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'center',
  as: Heading = 'h2',
  tone = 'light',
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  align?: 'center' | 'left';
  as?: 'h1' | 'h2';
  /** `dark` for navy backgrounds. */
  tone?: 'light' | 'dark';
}) {
  const dark = tone === 'dark';
  return (
    <div className={cn('max-w-2xl', align === 'center' && 'mx-auto text-center')}>
      {eyebrow && (
        <p className={cn('text-xs font-semibold uppercase tracking-wider', dark ? 'text-saffron-400' : 'text-primary-700')}>{eyebrow}</p>
      )}
      <Heading
        className={cn(
          'mt-1.5 font-display font-bold tracking-tight',
          dark ? 'text-white' : 'text-navy-900',
          Heading === 'h1' ? 'text-2xl sm:text-3xl lg:text-4xl' : 'text-xl sm:text-2xl lg:text-[1.75rem] lg:leading-tight',
        )}
      >
        {title}
      </Heading>
      {description && (
        <p className={cn('mt-2 text-sm leading-relaxed sm:text-base', dark ? 'text-navy-200' : 'text-foreground-muted')}>{description}</p>
      )}
    </div>
  );
}

/** Closing call-to-action band on navy, shared by the marketing pages. */
export function CtaBand({
  title = 'Put your field team on BharatSales AI',
  description = 'Create your organisation account, add products, outlets and reps, then install the Android app on your reps\' phones.',
}: {
  title?: ReactNode;
  description?: ReactNode;
}) {
  return (
    <section aria-labelledby="cta-title" className="bg-navy-900">
      <Container className="flex flex-col gap-4 py-8 sm:py-10 md:flex-row md:items-center md:justify-between md:gap-8">
        <div className="max-w-2xl">
          <h2 id="cta-title" className="font-display text-xl font-bold tracking-tight text-white sm:text-2xl">
            {title}
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-navy-200 sm:text-base">{description}</p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <Link to="/contact" className={buttonClassName({ variant: 'accent', size: 'lg', className: 'focus-visible:ring-offset-navy-900' })}>
            Book a Demo
          </Link>
          <Link to="/signup" className={buttonClassName({ variant: 'outline', size: 'lg', className: onNavyOutline })}>
            Create account
          </Link>
        </div>
      </Container>
    </section>
  );
}

/**
 * Real product screenshot (served from /public/screens). The box keeps a fixed
 * aspect ratio with a subtle navy placeholder, so the layout holds while the
 * image loads or if the file is missing (the broken-image icon is hidden).
 */
export function Screenshot({
  src,
  alt,
  width,
  height,
  eager = false,
  className,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  /** Above-the-fold images load eagerly; everything else lazily. */
  eager?: boolean;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={cn('relative w-full overflow-hidden bg-navy-50', className)} style={{ aspectRatio: `${width} / ${height}` }}>
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        onError={() => setFailed(true)}
        className={cn('absolute inset-0 h-full w-full object-cover object-top', failed && 'invisible')}
      />
    </div>
  );
}

/** Simple browser-window frame around a desktop screenshot. */
export function BrowserFrame({ label, children, className }: { label?: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn('overflow-hidden rounded-xl bg-white shadow-overlay ring-1 ring-navy-900/10', className)}>
      <div className="flex items-center gap-1.5 border-b border-border bg-surface-muted px-3 py-2">
        <span aria-hidden="true" className="h-2 w-2 rounded-full bg-gray-300" />
        <span aria-hidden="true" className="h-2 w-2 rounded-full bg-gray-300" />
        <span aria-hidden="true" className="h-2 w-2 rounded-full bg-gray-300" />
        {label && (
          <span className="ml-2 min-w-0 flex-1 truncate rounded-md bg-white px-2 py-0.5 text-[11px] text-foreground-subtle ring-1 ring-border">{label}</span>
        )}
      </div>
      {children}
    </div>
  );
}

/** Navy phone bezel around an Android app screenshot. */
export function PhoneFrame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-[1.75rem] bg-navy-900 p-1.5 shadow-overlay', className)}>
      <div className="overflow-hidden rounded-[1.35rem]">{children}</div>
    </div>
  );
}
