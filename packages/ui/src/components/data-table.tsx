import * as React from 'react';
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import { cn } from '../utils/cn';
import { Skeleton } from './skeleton';
import { EmptyState } from './empty-state';
import { Pagination } from './pagination';

export type SortDirection = 'asc' | 'desc';

export interface DataTableColumn<T> {
  /** Unique key. */
  id: string;
  header: React.ReactNode;
  /** Raw value for sorting and global search. A key of T or a function. */
  accessor?: keyof T | ((row: T) => unknown);
  /** Custom cell renderer. Defaults to String(accessor value). */
  cell?: (row: T, rowIndex: number) => React.ReactNode;
  sortable?: boolean;
  /** Custom comparator (asc). Default compares numbers, dates and strings naturally. */
  sortFn?: (a: T, b: T) => number;
  /** Right-align numbers and money. */
  align?: 'left' | 'right' | 'center';
  /** Tailwind width class, e.g. 'w-32'. */
  width?: string;
  className?: string;
  headerClassName?: string;
  /** Hide below md (table layout) — for low-priority columns. */
  hideBelow?: 'sm' | 'md' | 'lg';
  /** Card layout: use as the card title (first column by default). */
  primary?: boolean;
  /** Card layout: omit this column. */
  hideInCard?: boolean;
  /** Exclude from global search. */
  searchable?: boolean;
}

export interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  /** Stable row key. Defaults to row.id / row._id / index. */
  getRowId?: (row: T, index: number) => string;
  loading?: boolean;
  /** Skeleton rows while loading. */
  loadingRows?: number;
  /** Rendered instead of rows when set (e.g. <ErrorState onRetry>). */
  error?: React.ReactNode;
  /** Custom empty state. Default: "No records found". */
  emptyState?: React.ReactNode;
  /** Filters/search slot rendered above the table inside the card. */
  toolbar?: React.ReactNode;
  /** Client-side text filter across column accessors. */
  globalFilter?: string;
  /** Client-side pagination. `false` shows all rows. Default { pageSize: 10, pageSizeOptions: [10, 25, 50, 100] }; pass pageSizeOptions: [] to hide the size picker. */
  pagination?: false | { pageSize?: number; pageSizeOptions?: number[] };
  initialSort?: { id: string; direction: SortDirection };
  onRowClick?: (row: T) => void;
  /** Highlights the row with this id (e.g. the one open in a Drawer). */
  selectedRowId?: string | null;
  /** 'scroll' (default): table scrolls sideways on phones. 'cards': stacked cards below md. */
  mobileLayout?: 'scroll' | 'cards';
  /** Accessible name for the table. */
  caption?: string;
  /** Row noun for the pagination summary, e.g. "orders". */
  itemLabel?: string;
  /** Wrap in a bordered card (default true). Set false when already inside a Card. */
  bordered?: boolean;
  dense?: boolean;
  className?: string;
  /** Rendered under the table (e.g. totals row). */
  footer?: React.ReactNode;
}

const HIDE: Record<NonNullable<DataTableColumn<unknown>['hideBelow']>, string> = {
  sm: 'hidden sm:table-cell',
  md: 'hidden md:table-cell',
  lg: 'hidden lg:table-cell',
};

function readValue<T>(row: T, col: DataTableColumn<T>): unknown {
  if (!col.accessor) return undefined;
  return typeof col.accessor === 'function' ? col.accessor(row) : (row as Record<string, unknown>)[col.accessor as string];
}

function compare(a: unknown, b: unknown): number {
  if (a === b) return 0;
  if (a === null || a === undefined || a === '') return 1;
  if (b === null || b === undefined || b === '') return -1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  const as = String(a);
  const bs = String(b);
  // ISO dates sort correctly as strings; numeric strings compare numerically.
  return as.localeCompare(bs, 'en-IN', { numeric: true, sensitivity: 'base' });
}

const defaultRowId = (row: unknown, i: number) => {
  const r = row as { id?: unknown; _id?: unknown };
  return String(r?.id ?? r?._id ?? i);
};

/**
 * Standard list table: sorting, search (via `globalFilter`), client-side
 * pagination, loading skeleton, empty and error states, sideways scroll or
 * card layout on phones.
 */
export function DataTable<T>({
  data,
  columns,
  getRowId = defaultRowId,
  loading,
  loadingRows = 5,
  error,
  emptyState,
  toolbar,
  globalFilter,
  pagination = {},
  initialSort,
  onRowClick,
  selectedRowId,
  mobileLayout = 'scroll',
  caption,
  itemLabel,
  bordered = true,
  dense,
  className,
  footer,
}: DataTableProps<T>) {
  const [sort, setSort] = React.useState<{ id: string; direction: SortDirection } | null>(initialSort ?? null);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(pagination ? pagination.pageSize ?? 10 : Number.MAX_SAFE_INTEGER);

  const filtered = React.useMemo(() => {
    const q = globalFilter?.trim().toLowerCase();
    if (!q) return data;
    const cols = columns.filter((c) => c.accessor && c.searchable !== false);
    return data.filter((row) =>
      cols.some((c) => {
        const v = readValue(row, c);
        return v !== null && v !== undefined && String(v).toLowerCase().includes(q);
      }),
    );
  }, [data, columns, globalFilter]);

  const sorted = React.useMemo(() => {
    if (!sort) return filtered;
    const col = columns.find((c) => c.id === sort.id);
    if (!col) return filtered;
    const dir = sort.direction === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => dir * (col.sortFn ? col.sortFn(a, b) : compare(readValue(a, col), readValue(b, col))));
  }, [filtered, sort, columns]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  // Clamp when data shrinks (filtering, deletes); reset when the filter changes.
  React.useEffect(() => {
    setPage(1);
  }, [globalFilter]);
  const currentPage = Math.min(page, pageCount);
  const rows = pagination ? sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize) : sorted;

  const toggleSort = (id: string) => {
    setSort((s) => (!s || s.id !== id ? { id, direction: 'asc' } : s.direction === 'asc' ? { id, direction: 'desc' } : null));
  };

  const align = (a?: 'left' | 'right' | 'center') => (a === 'right' ? 'text-right' : a === 'center' ? 'text-center' : 'text-left');
  // Compact theme: ~40px rows (py-2), ~34px dense rows.
  const cellPad = dense ? 'px-3 py-1.5' : 'px-3 py-2 sm:px-4';
  const clickable = !!onRowClick;

  const onRowKeyDown = (e: React.KeyboardEvent, row: T) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onRowClick?.(row);
    }
  };

  const isEmpty = !loading && !error && rows.length === 0;
  const empty =
    emptyState ??
    (globalFilter?.trim() ? (
      <EmptyState size="compact" title="No matches" description={`Nothing matches “${globalFilter.trim()}”. Try a different search.`} />
    ) : (
      <EmptyState size="compact" title="No records yet" description="New records will appear here." />
    ));

  const primaryCol = columns.find((c) => c.primary) ?? columns[0];
  // Row-action columns (a "…" menu, Approve/Reject, Suspend) render as a
  // right-aligned footer on each card instead of an unlabeled grid cell.
  const isActionCol = (c: DataTableColumn<T>) => c.id === 'actions' || c.header == null || c.header === '';
  const cardCols = columns.filter((c) => c !== primaryCol && !c.hideInCard && !isActionCol(c));
  const cardActionCols = columns.filter((c) => c !== primaryCol && !c.hideInCard && isActionCol(c));

  const table = (
    <div className={cn('overflow-x-auto', mobileLayout === 'cards' && 'hidden md:block')}>
      <table className="w-full min-w-full border-separate border-spacing-0 text-sm" aria-busy={loading || undefined}>
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr>
            {columns.map((col) => {
              const sorted = sort?.id === col.id ? sort.direction : undefined;
              return (
                <th
                  key={col.id}
                  scope="col"
                  aria-sort={sorted ? (sorted === 'asc' ? 'ascending' : 'descending') : col.sortable ? 'none' : undefined}
                  className={cn(
                    'sticky top-0 whitespace-nowrap border-b border-border bg-surface-muted text-2xs font-semibold uppercase tracking-wider text-foreground-subtle',
                    dense ? 'px-3 py-1.5' : 'px-3 py-2 sm:px-4',
                    align(col.align),
                    col.width,
                    col.hideBelow && HIDE[col.hideBelow],
                    col.headerClassName,
                  )}
                >
                  {col.sortable ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(col.id)}
                      className={cn(
                        '-mx-1 inline-flex items-center gap-1 rounded px-1 uppercase hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                        col.align === 'right' && 'flex-row-reverse',
                        sorted && 'text-gray-900',
                      )}
                    >
                      {col.header}
                      {sorted === 'asc' ? (
                        <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                      ) : sorted === 'desc' ? (
                        <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                      ) : (
                        <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" aria-hidden="true" />
                      )}
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: loadingRows }).map((_, r) => (
              <tr key={`sk-${r}`}>
                {columns.map((col, c) => (
                  <td key={col.id} className={cn(cellPad, 'border-b border-border', col.hideBelow && HIDE[col.hideBelow])}>
                    <Skeleton className={cn('h-4', c === 0 ? 'w-28' : col.align === 'right' ? 'ml-auto w-16' : 'w-20')} />
                  </td>
                ))}
              </tr>
            ))
          ) : error ? (
            <tr>
              <td colSpan={columns.length} className="p-3">
                {error}
              </td>
            </tr>
          ) : isEmpty ? (
            <tr>
              <td colSpan={columns.length}>{empty}</td>
            </tr>
          ) : (
            rows.map((row, r) => {
              const id = getRowId(row, r);
              const selected = selectedRowId != null && selectedRowId === id;
              return (
                <tr
                  key={id}
                  onClick={clickable ? () => onRowClick!(row) : undefined}
                  onKeyDown={clickable ? (e) => onRowKeyDown(e, row) : undefined}
                  tabIndex={clickable ? 0 : undefined}
                  data-selected={selected || undefined}
                  className={cn(
                    'group transition-colors',
                    clickable && 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500',
                    selected ? 'bg-primary-50/70' : clickable ? 'hover:bg-surface-subtle' : 'hover:bg-surface-muted',
                  )}
                >
                  {columns.map((col, c) => (
                    <td
                      key={col.id}
                      className={cn(
                        cellPad,
                        'border-b border-border align-middle text-gray-700 group-last:border-b-0',
                        align(col.align),
                        col.align === 'right' && 'tabular-nums',
                        c === 0 && selected && 'shadow-[inset_3px_0_0_0_theme(colors.primary.600)]',
                        col.hideBelow && HIDE[col.hideBelow],
                        col.className,
                      )}
                    >
                      {col.cell ? col.cell(row, r) : String(readValue(row, col) ?? '—')}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );

  const cards =
    mobileLayout === 'cards' ? (
      <div className="md:hidden">
        {loading ? (
          <ul className="divide-y divide-border" aria-busy="true">
            {Array.from({ length: Math.min(loadingRows, 4) }).map((_, i) => (
              <li key={i} className="space-y-2 p-3">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-3.5 w-1/3" />
              </li>
            ))}
          </ul>
        ) : error ? (
          <div className="p-3">{error}</div>
        ) : isEmpty ? (
          empty
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((row, r) => {
              const id = getRowId(row, r);
              const selected = selectedRowId != null && selectedRowId === id;
              const body = (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 font-medium text-gray-900">{primaryCol.cell ? primaryCol.cell(row, r) : String(readValue(row, primaryCol) ?? '—')}</div>
                    {cardActionCols.length > 0 && (
                      // Row actions sit top-right beside the title instead of on a line of their own.
                      <div className="-my-1 flex shrink-0 items-center gap-1">
                        {cardActionCols.map((col) => (
                          <div key={col.id}>{col.cell ? col.cell(row, r) : null}</div>
                        ))}
                      </div>
                    )}
                  </div>
                  <dl className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm">
                    {cardCols.map((col) => (
                      <div key={col.id} className="min-w-0">
                        <dt className="text-xs text-foreground-subtle">{col.header}</dt>
                        <dd className="mt-0.5 truncate text-gray-800">{col.cell ? col.cell(row, r) : String(readValue(row, col) ?? '—')}</dd>
                      </div>
                    ))}
                  </dl>
                </>
              );
              return (
                <li key={id} className={cn(selected && 'bg-primary-50/70')}>
                  {clickable ? (
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => onRowClick!(row)}
                      onKeyDown={(e) => onRowKeyDown(e, row)}
                      className="block w-full p-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500 active:bg-surface-subtle"
                    >
                      {body}
                    </div>
                  ) : (
                    <div className="p-3">{body}</div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    ) : null;

  const sizeOptions = pagination ? pagination.pageSizeOptions ?? [10, 25, 50, 100] : [];
  // Hide the whole bar for short lists that fit on the smallest page size.
  const showPagination = pagination && !loading && !error && sorted.length > Math.min(pageSize, sizeOptions[0] ?? pageSize);

  return (
    <div className={cn(bordered && 'overflow-hidden rounded-xl border border-border bg-white shadow-soft', className)}>
      {toolbar && <div className="border-b border-border px-3 py-2.5 sm:px-4">{toolbar}</div>}
      {table}
      {cards}
      {footer && <div className="border-t border-border px-3 py-2 sm:px-4">{footer}</div>}
      {showPagination && (
        <div className="border-t border-border px-3 py-2 sm:px-4">
          <Pagination
            page={currentPage}
            pageSize={pageSize}
            totalItems={sorted.length}
            onPageChange={setPage}
            onPageSizeChange={
              sizeOptions.length > 1
                ? (s) => {
                    setPageSize(s);
                    setPage(1);
                  }
                : undefined
            }
            pageSizeOptions={sizeOptions}
            itemLabel={itemLabel}
          />
        </div>
      )}
    </div>
  );
}
