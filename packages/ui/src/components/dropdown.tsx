import * as React from 'react';
import { cn } from '../utils/cn';
import { useClickOutside, useEscapeKey } from '../hooks';
import { UILink } from './link';

export type DropdownItem =
  | {
      type?: 'item';
      label: React.ReactNode;
      icon?: React.ReactNode;
      /** Run on select. */
      onSelect?: () => void;
      /** Navigate instead (router-aware via LinkProvider). */
      href?: string;
      /** Red text — for destructive actions (Delete, Log out). */
      danger?: boolean;
      disabled?: boolean;
      /** Right-side hint, e.g. a shortcut or count. */
      hint?: React.ReactNode;
    }
  | { type: 'separator' }
  | { type: 'label'; label: React.ReactNode };

export interface DropdownMenuProps {
  /**
   * The trigger button. Receives the props to spread (ref, onClick,
   * aria-expanded, aria-haspopup, aria-controls): trigger={(p) => <IconButton {...p} … />}.
   */
  trigger: (props: {
    ref: React.Ref<HTMLButtonElement>;
    onClick: () => void;
    onKeyDown: (e: React.KeyboardEvent) => void;
    'aria-expanded': boolean;
    'aria-haspopup': 'menu';
    'aria-controls': string;
  }) => React.ReactNode;
  items: DropdownItem[];
  align?: 'start' | 'end';
  side?: 'bottom' | 'top';
  /** Optional content above the items (e.g. signed-in user info). */
  header?: React.ReactNode;
  className?: string;
  /** Width class, default w-56. */
  widthClassName?: string;
}

/** Actions menu (row actions "⋯", user menu). Keyboard: ↑/↓, Home/End, Esc, Enter. */
export function DropdownMenu({ trigger, items, align = 'end', side = 'bottom', header, className, widthClassName = 'w-56' }: DropdownMenuProps) {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const menuId = React.useId();

  const close = React.useCallback((restoreFocus = true) => {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  }, []);

  useClickOutside([triggerRef, menuRef], () => close(false), open);
  useEscapeKey(() => close(), open);

  const menuItems = () => Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])') ?? []);

  React.useEffect(() => {
    if (open) requestAnimationFrame(() => menuItems()[0]?.focus());
  }, [open]);

  const onMenuKeyDown = (e: React.KeyboardEvent) => {
    const list = menuItems();
    const i = list.indexOf(document.activeElement as HTMLElement);
    let next: HTMLElement | undefined;
    if (e.key === 'ArrowDown') next = list[(i + 1) % list.length];
    else if (e.key === 'ArrowUp') next = list[(i - 1 + list.length) % list.length];
    else if (e.key === 'Home') next = list[0];
    else if (e.key === 'End') next = list[list.length - 1];
    else if (e.key === 'Tab') {
      setOpen(false);
      return;
    }
    if (next) {
      e.preventDefault();
      next.focus();
    }
  };

  const itemClass = (danger?: boolean, disabled?: boolean) =>
    cn(
      'flex min-h-[44px] w-full items-center gap-2.5 rounded-md px-2.5 text-left text-sm outline-none transition-colors sm:min-h-9',
      '[&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0',
      disabled
        ? 'cursor-not-allowed text-gray-400'
        : danger
          ? 'text-danger-700 hover:bg-danger-50 focus:bg-danger-50'
          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus:bg-gray-100 focus:text-gray-900',
    );

  return (
    <div className={cn('relative inline-flex', className)}>
      {trigger({
        ref: triggerRef,
        onClick: () => setOpen((o) => !o),
        onKeyDown: (e) => {
          if (e.key === 'ArrowDown' && !open) {
            e.preventDefault();
            setOpen(true);
          }
        },
        'aria-expanded': open,
        'aria-haspopup': 'menu',
        'aria-controls': menuId,
      })}
      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          onKeyDown={onMenuKeyDown}
          className={cn(
            'absolute z-overlay max-h-[70vh] animate-scale-in overflow-y-auto rounded-xl border border-border bg-white p-1.5 shadow-overlay motion-reduce:animate-none',
            side === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2',
            align === 'end' ? 'right-0' : 'left-0',
            widthClassName,
          )}
        >
          {header && <div className="border-b border-border px-2.5 pb-2.5 pt-1.5 mb-1">{header}</div>}
          {items.map((item, idx) => {
            if (item.type === 'separator') return <div key={idx} role="separator" className="my-1 h-px bg-border" />;
            if (item.type === 'label')
              return (
                <div key={idx} className="px-2.5 pb-1 pt-2 text-2xs font-semibold uppercase tracking-wider text-foreground-subtle">
                  {item.label}
                </div>
              );
            const content = (
              <>
                {item.icon}
                <span className="flex-1 truncate">{item.label}</span>
                {item.hint && <span className="text-xs text-foreground-subtle">{item.hint}</span>}
              </>
            );
            if (item.href && !item.disabled) {
              return (
                <UILink
                  key={idx}
                  href={item.href}
                  role="menuitem"
                  tabIndex={-1}
                  className={itemClass(item.danger)}
                  onClick={() => {
                    item.onSelect?.();
                    close(false);
                  }}
                >
                  {content}
                </UILink>
              );
            }
            return (
              <button
                key={idx}
                type="button"
                role="menuitem"
                tabIndex={-1}
                aria-disabled={item.disabled || undefined}
                className={itemClass(item.danger, item.disabled)}
                onClick={() => {
                  if (item.disabled) return;
                  close();
                  item.onSelect?.();
                }}
              >
                {content}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
