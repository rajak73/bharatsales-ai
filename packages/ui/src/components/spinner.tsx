import * as React from 'react';
import { cn } from '../utils/cn';

export interface SpinnerProps extends React.SVGAttributes<SVGSVGElement> {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** Screen-reader text. Pass `label={null}` when a parent already announces loading. */
  label?: string | null;
}

const SIZES = { xs: 'h-3.5 w-3.5', sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-8 w-8' };

/** Circular loading indicator. Inherits `currentColor`. */
export function Spinner({ size = 'md', label = 'Loading', className, ...props }: SpinnerProps) {
  return (
    <>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className={cn('animate-spin motion-reduce:animate-[spin_1.5s_linear_infinite]', SIZES[size], className)}
        {...props}
      >
        <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
        <path d="M21.5 12a9.5 9.5 0 0 0-9.5-9.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
      {label ? <span className="sr-only">{label}</span> : null}
    </>
  );
}

/** Centred spinner for a section/page that is loading (prefer Skeletons for known layouts). */
export function LoadingState({ label = 'Loading…', className }: { label?: string; className?: string }) {
  return (
    <div role="status" aria-live="polite" className={cn('flex flex-col items-center justify-center gap-3 py-16 text-foreground-subtle', className)}>
      <Spinner size="lg" className="text-primary-600" label={null} />
      <span className="text-sm">{label}</span>
    </div>
  );
}
