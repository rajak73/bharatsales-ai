import type { ReactNode } from 'react';
import { Check, MapPin, ShoppingCart, Trophy, Wallet, Warehouse } from 'lucide-react';
import { cn } from '@bharatsales/ui';
import { BrowserFrame, Container, CtaBand, MarketingLayout, PhoneFrame, Screenshot, SectionHeading } from '../_public/marketing';

interface Feature {
  id: string;
  icon: ReactNode;
  eyebrow: string;
  title: string;
  desc: string;
  points: string[];
  visual: ReactNode;
}

/* Real screenshots from /public/screens (see Screenshot for the placeholder behaviour). */

function DesktopShot({ src, alt, label }: { src: string; alt: string; label: string }) {
  return (
    <BrowserFrame label={label}>
      <Screenshot src={src} alt={alt} width={1440} height={900} />
    </BrowserFrame>
  );
}

function PhoneShot({ src, alt }: { src: string; alt: string }) {
  return (
    <PhoneFrame className="mx-auto w-full max-w-[15rem]">
      <Screenshot src={src} alt={alt} width={780} height={1688} />
    </PhoneFrame>
  );
}

const FEATURES: Feature[] = [
  {
    id: 'beats',
    icon: <MapPin />,
    eyebrow: 'Field force',
    title: 'Beats, attendance & live tracking',
    desc: 'Managers assign beats (outlet routes) to reps. Reps start the day with a selfie, then check in at each outlet with GPS.',
    points: [
      'Check-ins outside the outlet radius are flagged for the manager',
      'Live map of reps for sales managers',
      'Works offline; visits sync when the phone is back online',
    ],
    visual: <DesktopShot src="/screens/dashboard-map.webp" alt="Live map of reps and outlets in the web dashboard" label="Live map" />,
  },
  {
    id: 'orders',
    icon: <ShoppingCart />,
    eyebrow: 'Order booking',
    title: 'Orders from the field, with GST worked out',
    desc: 'Reps pick products from the catalogue in the Android app. The cart applies active schemes and CGST/SGST or IGST before the order is placed.',
    points: [
      'Orders are saved on the phone when offline and sent later',
      'Price lists and schemes set up by the admin',
      'Orders over an outlet’s credit limit go on credit hold',
    ],
    visual: <PhoneShot src="/screens/app-cart.webp" alt="Order cart in the Android app with scheme discount, GST and total" />,
  },
  {
    id: 'distributors',
    icon: <Warehouse />,
    eyebrow: 'Distributor management',
    title: 'Distributors fulfil orders in the same system',
    desc: 'Each distributor signs in to see the orders placed by reps for their outlets, on the web or in the Android app.',
    points: ['Incoming orders and deliveries', 'Stock (inventory) per product', 'Returns and payments'],
    visual: <PhoneShot src="/screens/app-distributor-orders.webp" alt="Distributor order list in the Android app" />,
  },
  {
    id: 'collections',
    icon: <Wallet />,
    eyebrow: 'Collections & credit',
    title: 'Collections and outlet dues',
    desc: 'Reps record cash or cheque payments against an outlet and see its outstanding balance first. Approved returns raise a credit note.',
    points: ['Outstanding balance on every outlet', 'Credit limits per outlet and distributor', 'A wrongly recorded payment can be reversed'],
    visual: <DesktopShot src="/screens/dashboard-sales.webp" alt="Sales list in the web dashboard with orders and statuses" label="Sales" />,
  },
  {
    id: 'targets',
    icon: <Trophy />,
    eyebrow: 'Targets & reports',
    title: 'Targets, incentives and the daily sales report',
    desc: 'Set targets per rep and track achievement. Managers see the team ranked by achievement and the daily sales report (DSR).',
    points: ['Target vs achievement per rep', 'Incentive plans and payouts', 'Exportable and scheduled reports'],
    visual: <DesktopShot src="/screens/dashboard-home.webp" alt="Admin dashboard with sales KPIs and charts" label="Dashboard" />,
  },
];

export default function FeaturesPage() {
  return (
    <MarketingLayout>
      <section className="border-b border-border bg-background py-8 sm:py-10">
        <Container>
          <SectionHeading
            as="h1"
            eyebrow="Features"
            title="Everything you need to run field sales"
            description="The modules in BharatSales AI today: what reps do in the Android app and what the office sees on the web."
          />
          <nav aria-label="Jump to feature" className="mt-5 flex flex-wrap justify-center gap-2">
            {FEATURES.map((f) => (
              <a
                key={f.id}
                href={`#${f.id}`}
                className="inline-flex min-h-[40px] items-center gap-2 rounded-full border border-border bg-white px-3.5 text-sm font-medium text-gray-700 transition-colors hover:border-primary-200 hover:text-primary-700 sm:min-h-[36px] [&_svg]:h-4 [&_svg]:w-4"
              >
                <span aria-hidden="true" className="text-primary-600">{f.icon}</span>
                {f.eyebrow}
              </a>
            ))}
          </nav>
        </Container>
      </section>

      <div className="bg-white">
        {FEATURES.map((f, i) => (
          <section key={f.id} id={f.id} aria-labelledby={`${f.id}-title`} className="scroll-mt-20 border-b border-border py-8 last:border-b-0 sm:py-12">
            <Container className="grid items-center gap-6 lg:grid-cols-2 lg:gap-10">
              <div className={cn(i % 2 === 1 && 'lg:order-2')}>
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary-700 [&_svg]:h-4 [&_svg]:w-4">
                  <span aria-hidden="true">{f.icon}</span>
                  {f.eyebrow}
                </p>
                <h2 id={`${f.id}-title`} className="mt-1.5 font-display text-xl font-bold tracking-tight text-navy-900 sm:text-2xl">
                  {f.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-foreground-muted sm:text-base">{f.desc}</p>
                <ul className="mt-4 space-y-2">
                  {f.points.map((p) => (
                    <li key={p} className="flex gap-3 text-sm text-gray-700 sm:text-base">
                      <span aria-hidden="true" className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success-50 text-success-600">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
              <div className={cn('mx-auto w-full max-w-xl', i % 2 === 1 && 'lg:order-1')}>{f.visual}</div>
            </Container>
          </section>
        ))}
      </div>

      <CtaBand title="See it working on your own beats" description="Create your organisation account, or ask us for a demo." />
    </MarketingLayout>
  );
}
