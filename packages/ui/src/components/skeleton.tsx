import * as React from 'react';
import { cn } from '../utils/cn';

/** Grey placeholder block. Size it with className (h-4 w-32, h-10 w-full, rounded-full…). */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div aria-hidden="true" className={cn('animate-pulse rounded-md bg-gray-200/80 motion-reduce:animate-none', className)} {...props} />;
}

/** Several text lines; the last one is shorter. */
export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn('h-3.5', i === lines - 1 && lines > 1 ? 'w-3/5' : 'w-full')} />
      ))}
    </div>
  );
}

/** Screen-reader announcement + visual skeleton wrapper. Wrap any skeleton layout in this. */
export function LoadingRegion({ label = 'Loading', className, children }: { label?: string; className?: string; children: React.ReactNode }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}
