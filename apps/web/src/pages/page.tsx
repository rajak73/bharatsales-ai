import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Check,
  Download,
  FileText,
  MapPin,
  Navigation,
  RotateCcw,
  Route,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  Trophy,
  Users,
  Wallet,
  Warehouse,
  WifiOff,
} from 'lucide-react';
import { buttonClassName, cn } from '@bharatsales/ui';
import {
  ANDROID_APK_URL,
  BrowserFrame,
  Container,
  CtaBand,
  MarketingLayout,
  PhoneFrame,
  Screenshot,
  SectionHeading,
  onNavyOutline,
} from './_public/marketing';

const TRUST_FACTS: { icon: ReactNode; label: string }[] = [
  { icon: <WifiOff />, label: 'Offline order booking' },
  { icon: <MapPin />, label: 'GPS check-ins & live map' },
  { icon: <FileText />, label: 'GST on every order' },
  { icon: <Wallet />, label: 'Collections & credit limits' },
  { icon: <ShieldCheck />, label: 'Role-based access' },
];

const FEATURES: { icon: ReactNode; title: string; desc: string }[] = [
  { icon: <Route />, title: 'Beat planning', desc: 'Managers assign beats (outlet routes) to reps; each rep sees today\'s beat and its outlets in the app.' },
  { icon: <ShoppingCart />, title: 'Order booking', desc: 'Reps book orders from the product catalogue, even offline. GST and scheme discounts are calculated on each order.' },
  { icon: <Warehouse />, title: 'Distributor management (DMS)', desc: 'Distributors receive rep orders and manage stock, deliveries, returns and payments.' },
  { icon: <Navigation />, title: 'Live tracking', desc: 'GPS check-in at each outlet, flagged if the rep is outside the outlet radius. Managers see reps on a live map.' },
  { icon: <Wallet />, title: 'Collections & credit', desc: 'Record cash and cheque payments against outlet dues. Orders over an outlet\'s credit limit go on hold.' },
  { icon: <Trophy />, title: 'Targets & incentives', desc: 'Set targets per rep, track achievement %, rank the team and manage incentive plans and payouts.' },
  { icon: <BarChart3 />, title: 'Reports & DSR', desc: 'Daily sales report (DSR), sales analytics and exportable reports, including scheduled ones.' },
  { icon: <RotateCcw />, title: 'Returns', desc: 'Returns against an order go through approval; approved returns raise a credit note for the outlet.' },
];

const ROLES: { icon: ReactNode; role: string; line: string; points: string[] }[] = [
  {
    icon: <ShieldCheck />,
    role: 'Admin',
    line: 'Sets up the business.',
    points: ['Company settings, GST rates & hierarchy', 'Products, price lists & schemes', 'Team members and approval rules'],
  },
  {
    icon: <Users />,
    role: 'Sales Manager',
    line: 'Runs the team from the web.',
    points: ['Beats and the live map', 'Approvals queue', 'Targets, team performance & DSR'],
  },
  {
    icon: <Smartphone />,
    role: 'Sales Rep',
    line: 'Works from the Android app.',
    points: ['Start the day with a selfie', "Today's beat with GPS check-in", 'Book orders and collect payments offline'],
  },
  {
    icon: <Warehouse />,
    role: 'Distributor',
    line: 'Fulfils orders.',
    points: ['Incoming orders from reps', 'Stock and deliveries', 'Payments and returns'],
  },
];

const APP_POINTS = [
  'Works without network: orders and payments are saved on the phone and sync when it is back online',
  'Selfie attendance to start the day, then GPS check-in at each outlet',
  'Product catalogue with GST and scheme discounts worked out in the cart',
  'Outlet dues visible before collecting a payment',
];

const APP_SCREENS: { src: string; alt: string; caption: string }[] = [
  { src: '/screens/app-rep-home.webp', alt: "Sales rep home screen in the Android app with today's summary", caption: 'Rep home' },
  { src: '/screens/app-cart.webp', alt: 'Order cart in the Android app with GST and totals', caption: 'Order cart' },
  { src: '/screens/app-distributor-orders.webp', alt: 'Distributor order list in the Android app', caption: 'Distributor orders' },
  { src: '/screens/app-login.webp', alt: 'Android app sign-in screen', caption: 'Sign in' },
];

const TOUR: { src: string; alt: string; caption: string; detail: string }[] = [
  {
    src: '/screens/dashboard-sales.webp',
    alt: 'Web dashboard sales list with orders, outlets, amounts and statuses',
    caption: 'Sales & orders',
    detail: 'Every order from the field, with outlet, amount and status.',
  },
  {
    src: '/screens/dashboard-map.webp',
    alt: 'Web dashboard map of reps and outlets',
    caption: 'Live map',
    detail: 'Where your reps are and which outlets they have visited.',
  },
];

function IconTile({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600 [&_svg]:h-[18px] [&_svg]:w-[18px]', className)}
    >
      {children}
    </span>
  );
}

export default function HomePage() {
  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-navy-900 text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(40rem_24rem_at_85%_10%,rgba(27,79,216,0.28),transparent)]"
        />
        <Container className="relative grid items-center gap-8 py-10 sm:py-12 lg:grid-cols-[1.05fr_1fr] lg:gap-10 lg:py-14">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-navy-200">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-saffron-500" />
              Sales force automation + distributor management for India
            </p>
            <h1 className="mt-4 font-display text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
              Har outlet, har order, har rep —{' '}
              <span className="text-saffron-400">ek app mein</span>
            </h1>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-navy-200 sm:text-lg">
              Plan beats, book orders offline, see reps on a live map and record collections. A web dashboard for the office and an Android app for the field.
            </p>
            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
              <Link to="/contact" className={buttonClassName({ variant: 'accent', size: 'lg', className: 'gap-2 focus-visible:ring-offset-navy-900' })}>
                Book a Demo <ArrowRight aria-hidden="true" />
              </Link>
              <a href={ANDROID_APK_URL} className={buttonClassName({ variant: 'outline', size: 'lg', className: cn('gap-2', onNavyOutline) })}>
                <Download aria-hidden="true" /> Download Android App
              </a>
            </div>
            <p className="mt-3 text-xs text-navy-300">
              Already a customer?{' '}
              <Link to="/login" className="font-medium text-white underline-offset-4 hover:underline">
                Log in
              </Link>
            </p>
          </div>
          <BrowserFrame label="Admin dashboard" className="ring-white/10">
            <Screenshot
              src="/screens/dashboard-home.webp"
              alt="BharatSales AI admin dashboard with sales KPIs, charts and recent orders"
              width={1440}
              height={900}
              eager
            />
          </BrowserFrame>
        </Container>
      </section>

      {/* Trust strip */}
      <section aria-label="Highlights" className="border-b border-border bg-white">
        <Container>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-2.5 py-4 sm:flex sm:flex-wrap sm:justify-center sm:gap-x-7">
            {TRUST_FACTS.map((f, i) => (
              <li
                key={f.label}
                className={cn(
                  'flex items-center gap-2 text-sm font-medium text-gray-800 [&_svg]:h-4 [&_svg]:w-4',
                  i === TRUST_FACTS.length - 1 && 'col-span-2 sm:col-span-1',
                )}
              >
                <span aria-hidden="true" className="text-primary-600">{f.icon}</span>
                {f.label}
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* Product tour */}
      <section aria-labelledby="tour-title" className="bg-background py-8 sm:py-10">
        <Container>
          <SectionHeading
            eyebrow="Product tour"
            title={<span id="tour-title">The web dashboard your office works in</span>}
          />
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {TOUR.map((t) => (
              <figure key={t.src} className="min-w-0">
                <BrowserFrame>
                  <Screenshot src={t.src} alt={t.alt} width={1440} height={900} />
                </BrowserFrame>
                <figcaption className="mt-2 text-sm">
                  <span className="font-display font-bold text-navy-900">{t.caption}</span>
                  <span className="text-foreground-muted"> · {t.detail}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </Container>
      </section>

      {/* Features */}
      <section aria-labelledby="features-title" className="bg-white py-10 sm:py-12">
        <Container>
          <SectionHeading
            eyebrow="Features"
            title={<span id="features-title">Everything your field team and distributors need</span>}
            description="One platform that connects the head office with every beat, outlet and distributor."
          />
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex gap-3 rounded-xl border border-border bg-white p-4 transition-colors hover:border-primary-200">
                <IconTile>{f.icon}</IconTile>
                <div className="min-w-0">
                  <h3 className="font-display text-[0.9375rem] font-bold text-navy-900">{f.title}</h3>
                  <p className="mt-0.5 text-sm leading-snug text-foreground-muted">{f.desc}</p>
                </div>
              </div>
            ))}
            <Link
              to="/features"
              className="group flex items-center justify-between gap-3 rounded-xl border border-dashed border-primary-200 bg-primary-50 p-4 text-primary-700 transition-colors hover:border-primary-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <span>
                <span className="block font-display text-[0.9375rem] font-bold">Explore all features</span>
                <span className="mt-0.5 block text-sm text-primary-800">How each module works</span>
              </span>
              <ArrowRight className="h-5 w-5 shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          </div>
        </Container>
      </section>

      {/* Roles */}
      <section aria-labelledby="roles-title" className="border-y border-border bg-background py-10 sm:py-12">
        <Container>
          <SectionHeading
            eyebrow="Built for every role"
            title={<span id="roles-title">One app, the right screen for each person</span>}
            description="Admins, managers, reps and distributors each get their own menu and permissions."
          />
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {ROLES.map((r) => (
              <article key={r.role} className="rounded-xl border border-border bg-white p-4">
                <div className="flex items-center gap-2.5">
                  <IconTile className="bg-navy-900 text-saffron-400">{r.icon}</IconTile>
                  <div className="min-w-0">
                    <h3 className="font-display text-base font-bold text-navy-900">{r.role}</h3>
                    <p className="text-xs text-foreground-muted">{r.line}</p>
                  </div>
                </div>
                <ul className="mt-3 space-y-1.5 border-t border-border pt-3">
                  {r.points.map((p) => (
                    <li key={p} className="flex gap-2 text-sm text-gray-700">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-success-600" aria-hidden="true" />
                      {p}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </Container>
      </section>

      {/* Mobile app */}
      <section aria-labelledby="app-title" className="bg-white py-10 sm:py-12">
        <Container className="grid items-center gap-8 lg:grid-cols-[1fr_1.15fr] lg:gap-10">
          <div>
            <SectionHeading
              align="left"
              eyebrow="Android app"
              title={<span id="app-title">A field app that works where the network doesn&apos;t</span>}
              description="Reps and distributors sign in to the same account on their phones. Managers see the results on the web."
            />
            <ul className="mt-4 space-y-2">
              {APP_POINTS.map((p) => (
                <li key={p} className="flex gap-2.5 text-sm text-gray-700 sm:text-base">
                  <span aria-hidden="true" className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success-50 text-success-600">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  {p}
                </li>
              ))}
            </ul>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
              <a href={ANDROID_APK_URL} className={buttonClassName({ variant: 'primary', size: 'lg', className: 'gap-2' })}>
                <Download aria-hidden="true" /> Download APK (v1.0.5)
              </a>
              <span className="text-xs text-foreground-muted">Android · direct download from GitHub releases</span>
            </div>
          </div>
          {/* Phones: swipeable row on small screens, four across from sm up. */}
          <ul className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-4 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0">
            {APP_SCREENS.map((sc) => (
              <li key={sc.src} className="w-[40%] min-w-0 shrink-0 snap-start sm:w-auto">
                <figure>
                  <PhoneFrame>
                    <Screenshot src={sc.src} alt={sc.alt} width={780} height={1688} />
                  </PhoneFrame>
                  <figcaption className="mt-2 text-center text-xs font-medium text-foreground-muted">{sc.caption}</figcaption>
                </figure>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <CtaBand />
    </MarketingLayout>
  );
}
