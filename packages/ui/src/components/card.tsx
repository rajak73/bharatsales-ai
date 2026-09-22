import * as React from 'react';
import { cn } from '../utils/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** default: white + border. muted: slate-50 inset panel. interactive: hover state for clickable cards. */
  variant?: 'default' | 'muted' | 'interactive';
  /** Shorthand padding for simple cards (no Header/Body). Default 'none' so existing `className="p-6"` usage keeps working. */
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

// Compact theme: 12px dense widgets, 16px default, 20px roomy (desktop).
const PADDING = { none: '', sm: 'p-3', md: 'p-4', lg: 'p-4 sm:p-5' };

const Card = React.forwardRef<HTMLDivElement, CardProps>(({ className, variant = 'default', padding = 'none', ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'rounded-xl border border-border text-gray-900',
      variant === 'muted' ? 'bg-surface-muted' : 'bg-white shadow-soft',
      variant === 'interactive' &&
        'cursor-pointer transition-colors hover:border-primary-200 hover:bg-primary-50/30 focus-within:ring-2 focus-within:ring-primary-500',
      PADDING[padding],
      className,
    )}
    {...props}
  />
));
Card.displayName = 'Card';

export interface CardHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  /** Right-aligned actions (buttons, links, filters). */
  actions?: React.ReactNode;
  /** Adds a bottom divider (use when the body is a table/list). */
  divided?: boolean;
}

/** Card header. Either pass `title`/`description`/`actions`, or free-form children. */
const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(({ className, title, description, actions, divided, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-wrap items-start justify-between gap-x-3 gap-y-2 px-4 pt-3.5 sm:flex-nowrap', divided ? 'border-b border-border pb-3' : 'pb-0', className)}
    {...props}
  >
    {title || description ? (
      <div className="min-w-0 flex-1 basis-40 space-y-0.5">
        {title && <CardTitle>{title}</CardTitle>}
        {description && <CardDescription>{description}</CardDescription>}
      </div>
    ) : null}
    {children}
    {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
  </div>
));
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(({ className, ...props }, ref) => (
  <h2 ref={ref} className={cn('font-display text-[0.9375rem] font-semibold leading-6 text-gray-900', className)} {...props} />
));
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-sm text-foreground-subtle', className)} {...props} />
));
CardDescription.displayName = 'CardDescription';

/** Main card content. `flush` removes padding (tables, lists that run edge to edge). */
const CardBody = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { flush?: boolean }>(({ className, flush, ...props }, ref) => (
  <div ref={ref} className={cn(flush ? '' : 'p-4', className)} {...props} />
));
CardBody.displayName = 'CardBody';

/** Legacy (shadcn-style) content wrapper: padded with no top padding, to sit under CardHeader. */
const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-4 pt-3', className)} {...props} />
));
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col-reverse gap-2 border-t border-border px-4 py-2.5 sm:flex-row sm:items-center sm:justify-end', className)}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, CardBody };
