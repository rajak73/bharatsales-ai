import * as React from 'react';
import { cn } from '../utils/cn';

export interface TabItem {
  value: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  /** Count badge, e.g. pending items. */
  count?: number;
  disabled?: boolean;
}

export interface TabsProps {
  /** Unique id prefix linking tabs to <TabPanel>s. */
  id: string;
  items: TabItem[];
  value: string;
  onValueChange: (value: string) => void;
  /** underline: page-level sections. pills: compact filters/segmented control. */
  variant?: 'underline' | 'pills';
  className?: string;
  'aria-label'?: string;
}

const tabId = (id: string, value: string) => `${id}-tab-${value}`;
const panelId = (id: string, value: string) => `${id}-panel-${value}`;

/**
 * Accessible tablist (arrow keys, Home/End). Render the content yourself with
 * <TabPanel tabsId={id} value="x" active={value === 'x'}>…</TabPanel>.
 * Scrolls horizontally on small screens.
 */
export function Tabs({ id, items, value, onValueChange, variant = 'underline', className, ...props }: TabsProps) {
  const refs = React.useRef<Array<HTMLButtonElement | null>>([]);

  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    const enabled = items.map((t, i) => (t.disabled ? -1 : i)).filter((i) => i >= 0);
    const pos = enabled.indexOf(index);
    let next: number | undefined;
    if (e.key === 'ArrowRight') next = enabled[(pos + 1) % enabled.length];
    else if (e.key === 'ArrowLeft') next = enabled[(pos - 1 + enabled.length) % enabled.length];
    else if (e.key === 'Home') next = enabled[0];
    else if (e.key === 'End') next = enabled[enabled.length - 1];
    if (next === undefined) return;
    e.preventDefault();
    refs.current[next]?.focus();
    onValueChange(items[next].value);
  };

  return (
    <div
      role="tablist"
      aria-label={props['aria-label']}
      className={cn(
        '-mx-4 flex overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden',
        variant === 'underline' ? 'gap-1 border-b border-border sm:gap-3' : 'gap-1 rounded-lg bg-gray-100 p-1 sm:inline-flex',
        className,
      )}
    >
      {items.map((item, i) => {
        const selected = item.value === value;
        return (
          <button
            key={item.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={tabId(id, item.value)}
            aria-selected={selected}
            aria-controls={panelId(id, item.value)}
            tabIndex={selected ? 0 : -1}
            disabled={item.disabled}
            onClick={() => onValueChange(item.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              'inline-flex shrink-0 items-center gap-2 whitespace-nowrap text-sm font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50',
              '[&_svg]:h-4 [&_svg]:w-4',
              variant === 'underline'
                ? cn(
                    '-mb-px h-11 border-b-2 px-2 sm:h-10 sm:px-1',
                    selected ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-800',
                  )
                : cn('h-9 rounded-md px-3 sm:h-8', selected ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'),
            )}
          >
            {item.icon}
            {item.label}
            {item.count !== undefined && (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-2xs font-semibold tabular-nums',
                  selected ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600',
                )}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export interface TabPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  tabsId: string;
  value: string;
  active: boolean;
  /** Keep mounted when inactive (preserves form state). Default false. */
  keepMounted?: boolean;
}

export function TabPanel({ tabsId, value, active, keepMounted, className, children, ...props }: TabPanelProps) {
  if (!active && !keepMounted) return null;
  return (
    <div
      role="tabpanel"
      id={panelId(tabsId, value)}
      aria-labelledby={tabId(tabsId, value)}
      hidden={!active}
      tabIndex={0}
      className={cn('focus-visible:outline-none', className)}
      {...props}
    >
      {children}
    </div>
  );
}
