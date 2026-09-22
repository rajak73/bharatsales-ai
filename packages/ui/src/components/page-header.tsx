import * as React from 'react';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { cn } from '../utils/cn';
import { UILink } from './link';

export interface Breadcrumb {
  label: React.ReactNode;
  /** Omit for the current page (last crumb). */
  href?: string;
}

export interface PageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  breadcrumbs?: Breadcrumb[];
  /** Page-level actions (primary action last, rightmost). Wraps below the title on phones. */
  actions?: React.ReactNode;
  /** Shows a "Back" link above the title (detail pages). */
  back?: { href: string; label?: string };
  /** Inline element after the title, e.g. <StatusPill>. */
  titleAddon?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Top of every dashboard page: breadcrumbs → title (h1) + description →
 * actions. Follow it with a filter bar (<Toolbar>) and the content card.
 */
export function PageHeader({ title, description, breadcrumbs, actions, back, titleAddon, className, children }: PageHeaderProps) {
  return (
    <header className={cn('mb-4', className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-1.5">
          <ol className="flex flex-wrap items-center gap-1 text-sm text-foreground-subtle">
            {breadcrumbs.map((c, i) => {
              const last = i === breadcrumbs.length - 1;
              return (
                <li key={i} className="flex items-center gap-1">
                  {c.href && !last ? (
                    <UILink href={c.href} className="rounded hover:text-gray-900 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500">
                      {c.label}
                    </UILink>
                  ) : (
                    <span aria-current={last ? 'page' : undefined} className={last ? 'font-medium text-gray-700' : undefined}>
                      {c.label}
                    </span>
                  )}
                  {!last && <ChevronRight className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />}
                </li>
              );
            })}
          </ol>
        </nav>
      )}
      {back && (
        <UILink
          href={back.href}
          className="mb-1.5 inline-flex min-h-[44px] items-center gap-1.5 rounded text-sm font-medium text-foreground-muted hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 sm:min-h-0"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {back.label ?? 'Back'}
        </UILink>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <h1 className="font-display text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">{title}</h1>
            {titleAddon}
          </div>
          {description && <p className="mt-0.5 max-w-3xl text-sm text-foreground-muted">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-nowrap [&>*]:flex-1 sm:[&>*]:flex-none">{actions}</div>}
      </div>
      {children && <div className="mt-3">{children}</div>}
    </header>
  );
}

/**
 * Filters bar between PageHeader and content: search on the left, filters
 * and secondary actions on the right. Stacks on phones.
 */
export function Toolbar({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center [&>*:first-child]:sm:min-w-[16rem] [&>*:first-child]:sm:max-w-sm [&>*:first-child]:sm:flex-1 sm:[&>*:not(:first-child)]:w-auto sm:[&>*:not(:first-child)]:min-w-[11rem]',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/** Vertical rhythm for a page body: consistent 16px gaps between sections (compact theme). */
export function PageSection({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('space-y-4', className)} {...props} />;
}
