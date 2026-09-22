import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { Container, MarketingLayout } from './marketing';

export interface LegalSection {
  id: string;
  title: string;
  body: ReactNode;
}

function Toc({ sections }: { sections: LegalSection[] }) {
  return (
    <ol className="space-y-1 text-sm">
      {sections.map((s, i) => (
        <li key={s.id}>
          <a
            href={`#${s.id}`}
            className="flex min-h-[40px] items-center gap-2 rounded-lg px-3 text-foreground-muted transition-colors hover:bg-background hover:text-navy-900 lg:min-h-[32px]"
          >
            <span className="w-5 shrink-0 tabular-nums text-foreground-subtle">{i + 1}.</span>
            {s.title}
          </a>
        </li>
      ))}
    </ol>
  );
}

/** Long-form legal page (terms, privacy) with an "On this page" index. */
export function LegalPage({ title, updated, intro, sections }: { title: string; updated: string; intro?: ReactNode; sections: LegalSection[] }) {
  return (
    <MarketingLayout>
      <section className="border-b border-border bg-background py-8 sm:py-10">
        <Container>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary-700">Legal</p>
          <h1 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-navy-900 sm:text-3xl">{title}</h1>
          <p className="mt-2 text-sm text-foreground-muted">Last updated: {updated}</p>
        </Container>
      </section>

      <Container className="grid gap-6 py-8 sm:py-10 lg:grid-cols-[14rem_1fr] lg:gap-10">
        {/* Index: collapsible on phones, sticky sidebar on desktop */}
        <aside>
          <details className="group rounded-xl border border-border bg-white lg:hidden">
            <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between px-4 text-sm font-medium text-gray-900 [&::-webkit-details-marker]:hidden">
              On this page
              <ChevronDown className="h-4 w-4 text-gray-500 transition-transform group-open:rotate-180" aria-hidden="true" />
            </summary>
            <nav aria-label="On this page" className="border-t border-border p-2">
              <Toc sections={sections} />
            </nav>
          </details>
          <nav aria-label="On this page" className="sticky top-20 hidden lg:block">
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-foreground-subtle">On this page</p>
            <Toc sections={sections} />
          </nav>
        </aside>

        <article className="min-w-0 max-w-3xl">
          {intro && <div className="mb-6 text-base leading-relaxed text-foreground-muted">{intro}</div>}
          <div className="space-y-7">
            {sections.map((s, i) => (
              <section key={s.id} id={s.id} aria-labelledby={`${s.id}-h`} className="scroll-mt-20">
                <h2 id={`${s.id}-h`} className="font-display text-lg font-bold text-navy-900">
                  {i + 1}. {s.title}
                </h2>
                <div className="mt-2 space-y-3 text-base leading-relaxed text-gray-700">{s.body}</div>
              </section>
            ))}
          </div>
        </article>
      </Container>
    </MarketingLayout>
  );
}
