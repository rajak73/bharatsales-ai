import * as React from 'react';
import { cn } from '../utils/cn';
import { Checkbox, SearchInput } from './input';

export interface CheckListItem {
  id: string;
  label: string;
}

export interface CheckListProps {
  /** Fieldset legend, e.g. "Territories". */
  label: string;
  items: CheckListItem[];
  selected: string[];
  onToggle: (id: string, checked: boolean) => void;
  /** Shown when `items` is empty. */
  emptyText: React.ReactNode;
  /** Show the filter box once the list is longer than this (default 6). */
  filterThreshold?: number;
  filterPlaceholder?: string;
  /** Tailwind max-height class for the scroll area (default max-h-56). */
  maxHeightClassName?: string;
  className?: string;
}

/** Scrollable, filterable multi-select checkbox list with a "N selected" count. */
export function CheckList({
  label,
  items,
  selected,
  onToggle,
  emptyText,
  filterThreshold = 6,
  filterPlaceholder,
  maxHeightClassName = 'max-h-56',
  className,
}: CheckListProps) {
  const [q, setQ] = React.useState('');
  const needle = q.trim().toLowerCase();
  const visible = needle ? items.filter((i) => i.label.toLowerCase().includes(needle)) : items;
  const placeholder = filterPlaceholder ?? `Filter ${label.toLowerCase()}`;
  return (
    <fieldset className={cn('min-w-0 space-y-2', className)}>
      <legend className="flex w-full items-center justify-between text-sm font-medium text-gray-900">
        <span>{label}</span>
        <span className="text-xs font-normal tabular-nums text-foreground-subtle">{selected.length} selected</span>
      </legend>
      {items.length > filterThreshold && (
        <SearchInput size="sm" value={q} onValueChange={setQ} placeholder={placeholder} aria-label={placeholder} />
      )}
      <div className={cn('divide-y divide-border overflow-y-auto rounded-lg border border-border', maxHeightClassName)}>
        {items.length === 0 ? (
          <p className="p-3 text-sm text-foreground-subtle">{emptyText}</p>
        ) : visible.length === 0 ? (
          <p className="p-3 text-sm text-foreground-subtle">No matches for “{q}”.</p>
        ) : (
          visible.map((item) => (
            <div key={item.id} className="px-3 py-2.5 hover:bg-surface-subtle">
              <Checkbox label={item.label} checked={selected.includes(item.id)} onChange={(e) => onToggle(item.id, e.target.checked)} />
            </div>
          ))
        )}
      </div>
    </fieldset>
  );
}
