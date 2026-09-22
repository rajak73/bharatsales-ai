import { Check } from 'lucide-react';
import { Container, CtaBand, MarketingLayout, SectionHeading } from '../_public/marketing';
import { INCLUDED_IN_ALL, PLANS, PlanCard } from '../_public/plans';

export default function PricingPage() {
  return (
    <MarketingLayout>
      <section className="border-b border-border bg-background py-8 sm:py-10">
        <Container>
          <SectionHeading
            as="h1"
            eyebrow="Pricing"
            title="One price per organisation"
            description="Every plan includes every module. Plans differ only by how many users you can add."
          />
          <div className="mx-auto mt-6 grid max-w-5xl gap-4 lg:grid-cols-3">
            {PLANS.map((p) => (
              <PlanCard key={p.id} plan={p} headingLevel="h2" />
            ))}
          </div>
          <p className="mt-3 text-center text-sm text-foreground-muted">
            New organisations are reviewed by the platform admin before they go live.
          </p>
        </Container>
      </section>

      <section aria-labelledby="included-title" className="bg-white py-8 sm:py-10">
        <Container className="max-w-5xl">
          <h2 id="included-title" className="text-center font-display text-xl font-bold tracking-tight text-navy-900 sm:text-2xl">
            Included in every plan
          </h2>
          <ul className="mt-4 grid gap-x-6 gap-y-2 rounded-xl border border-border bg-white p-4 sm:grid-cols-2 sm:p-5">
            {INCLUDED_IN_ALL.map((f) => (
              <li key={f} className="flex gap-3 text-sm text-gray-700">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" aria-hidden="true" />
                {f}
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <CtaBand title="Not sure which plan fits?" description="Tell us how many reps, managers and distributors will use it and we'll suggest a plan." />
    </MarketingLayout>
  );
}
