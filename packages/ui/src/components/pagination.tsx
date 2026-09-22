import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../utils/cn';
import { formatNumber } from '../utils/format';

export interface PaginationProps {
  /** 1-based current page. */
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  className?: string;
  /** Noun for the summary, default "results" → "Showing 1–10 of 57 results". */
  itemLabel?: string;
}

function pageList(current: number, total: number): Array<number | 'gap'> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current, current - 1, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: Array<number | 'gap'> = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push('gap');
    out.push(p);
  });
  return out;
}

const pageBtn =
  'inline-flex h-10 min-w-10 items-center justify-center rounded-lg px-2 text-sm font-medium tabular-nums transition-colors sm:h-8 sm:min-w-8 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-40';

/** Page controls with "Showing x–y of z" and an optional rows-per-page select. */
export function Pagination({ page, pageSize, totalItems, onPageChange, onPageSizeChange, pageSizeOptions = [10, 25, 50, 100], className, itemLabel = 'results' }: PaginationProps) {
  const pageCount = Math.max(1, Math.ceil(totalItems / pageSize));
  const from = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);
  const selectId = React.useId();

  return (
    <nav aria-label="Pagination" className={cn('flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between', className)}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-foreground-subtle">
        <p aria-live="polite">
          Showing <span className="font-medium text-gray-900">{formatNumber(from)}</span>–<span className="font-medium text-gray-900">{formatNumber(to)}</span> of{' '}
          <span className="font-medium text-gray-900">{formatNumber(totalItems)}</span> {itemLabel}
        </p>
        {onPageSizeChange && (
          <div className="flex items-center gap-2">
            <label htmlFor={selectId}>Rows per page</label>
            <select
              id={selectId}
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="h-10 rounded-lg border border-border-strong bg-white px-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 sm:h-8"
            >
              {pageSizeOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      {pageCount > 1 && (
        <div className="flex items-center gap-1">
          <button type="button" className={cn(pageBtn, 'text-gray-600 hover:bg-gray-100')} onClick={() => onPageChange(page - 1)} disabled={page <= 1} aria-label="Previous page">
            <ChevronLeft className="h-4 w-4" />
          </button>
          {/* Numbered pages on ≥sm; compact "3 / 12" on phones */}
          <span className="px-2 tabular-nums text-gray-700 sm:hidden">
            {page} / {pageCount}
          </span>
          <div className="hidden items-center gap-1 sm:flex">
            {pageList(page, pageCount).map((p, i) =>
              p === 'gap' ? (
                <span key={`gap-${i}`} className="px-1 text-gray-400" aria-hidden="true">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  type="button"
                  onClick={() => onPageChange(p)}
                  aria-current={p === page ? 'page' : undefined}
                  aria-label={`Page ${p}`}
                  className={cn(pageBtn, p === page ? 'bg-primary-50 text-primary-700 ring-1 ring-inset ring-primary-200' : 'text-gray-600 hover:bg-gray-100')}
                >
                  {p}
                </button>
              ),
            )}
          </div>
          <button type="button" className={cn(pageBtn, 'text-gray-600 hover:bg-gray-100')} onClick={() => onPageChange(page + 1)} disabled={page >= pageCount} aria-label="Next page">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </nav>
  );
}
