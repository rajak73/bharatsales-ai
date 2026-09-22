import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Package, PaintBucket, Pill, Wheat } from 'lucide-react';
import { buttonClassName } from '@bharatsales/ui';
import { Container, CtaBand, MarketingLayout, SectionHeading } from '../_public/marketing';

// Only capabilities that exist in the product today; each card says how they fit that sector.
const INDUSTRIES: { icon: ReactNode; title: string; desc: string; points: string[] }[] = [
  {
    icon: <Package />,
    title: 'Fast-moving consumer goods (FMCG)',
    desc: 'Many small outlets per beat and frequent repeat orders. Reps book orders offline and schemes are applied in the cart.',
    points: ['Beats and outlet check-ins', 'Schemes and price lists', 'Distributor stock and deliveries'],
  },
  {
    icon: <Pill />,
    title: 'Pharmaceuticals & OTC',
    desc: 'Chemist and medical-store visits on fixed routes, with GST on every order and returns handled through approval.',
    points: ['GPS-verified outlet visits', 'Returns with approval and credit notes', 'Daily sales report (DSR)'],
  },
  {
    icon: <Wheat />,
    title: 'Agri inputs',
    desc: 'Dealers spread across rural areas with patchy network. The Android app keeps working offline and syncs later.',
    points: ['Offline orders, payments and visits', 'Outlet dues before each collection', 'Credit limits per dealer'],
  },
  {
    icon: <PaintBucket />,
    title: 'Paints & building materials',
    desc: 'Larger orders on credit through distributors. Orders that cross a credit limit go on hold for review.',
    points: ['Outlet and distributor credit limits', 'Collections against outstanding', 'Targets and incentive plans'],
  },
];

export default function IndustriesPage() {
  return (
    <MarketingLayout>
      <section className="border-b border-border bg-background py-8 sm:py-10">
        <Container>
          <SectionHeading
            as="h1"
            eyebrow="Industries"
            title="Built for Indian industries"
            description="BharatSales AI fits businesses that sell through distributors to many retail outlets. Here is how the same features apply by sector."
          />
        </Container>
      </section>

      <section className="bg-white py-8 sm:py-10">
        <Container>
          <div className="grid gap-4 md:grid-cols-2">
            {INDUSTRIES.map((ind) => (
              <article key={ind.title} className="flex flex-col rounded-xl border border-border bg-white p-4 shadow-soft sm:p-5">
                <span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600 [&_svg]:h-5 [&_svg]:w-5">
                  {ind.icon}
                </span>
                <h2 className="mt-3 font-display text-lg font-bold tracking-tight text-navy-900">{ind.title}</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-foreground-muted">{ind.desc}</p>
                <ul className="mt-3 space-y-1.5 border-t border-border pt-3">
                  {ind.points.map((p) => (
                    <li key={p} className="flex gap-3 text-sm text-gray-700">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" aria-hidden="true" />
                      {p}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>

          <div className="mt-4 flex flex-col items-center gap-3 rounded-xl border border-dashed border-border-strong bg-background px-4 py-5 text-center sm:flex-row sm:justify-between sm:text-left">
            <div>
              <h2 className="font-display text-base font-bold text-navy-900">Don&apos;t see your industry?</h2>
              <p className="mt-1 text-sm text-foreground-muted">If you sell through distributors to retail outlets, the same setup applies. Tell us how you work.</p>
            </div>
            <Link to="/contact" className={buttonClassName({ variant: 'outline', className: 'gap-2' })}>
              Contact us <ArrowRight aria-hidden="true" />
            </Link>
          </div>
        </Container>
      </section>

      <CtaBand />
    </MarketingLayout>
  );
}
