import * as React from 'react';
import { cn } from '../utils/cn';

export interface TooltipProps {
  content: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  /** The trigger. Must be a single focusable element (button, link) that can take a ref-less aria-describedby. */
  children: React.ReactElement;
  /** Delay before showing, ms. */
  delay?: number;
  /** Classes for the tooltip bubble. */
  className?: string;
  /** Classes for the inline wrapper around the trigger (e.g. 'flex w-full'). */
  wrapperClassName?: string;
  disabled?: boolean;
}

const SIDE: Record<NonNullable<TooltipProps['side']>, string> = {
  top: 'bottom-full left-1/2 mb-2 -translate-x-1/2',
  bottom: 'top-full left-1/2 mt-2 -translate-x-1/2',
  left: 'right-full top-1/2 mr-2 -translate-y-1/2',
  right: 'left-full top-1/2 ml-2 -translate-y-1/2',
};

/**
 * Short hint on hover/focus (not for essential info — touch users rarely
 * see it). Icon-only buttons still need their own aria-label.
 */
export function Tooltip({ content, side = 'top', children, delay = 300, className, wrapperClassName, disabled }: TooltipProps) {
  const [open, setOpen] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout>>();
  const id = React.useId();

  const show = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(true), delay);
  };
  const hide = () => {
    clearTimeout(timer.current);
    setOpen(false);
  };
  React.useEffect(() => () => clearTimeout(timer.current), []);

  if (disabled || !content) return children;

  const child = React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
    'aria-describedby': open ? id : undefined,
  });

  return (
    <span
      className={cn('relative inline-flex', wrapperClassName)}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      onKeyDown={(e) => e.key === 'Escape' && hide()}
    >
      {child}
      {open && (
        <span
          role="tooltip"
          id={id}
          className={cn(
            'pointer-events-none absolute z-tooltip w-max max-w-xs animate-fade-in rounded-md bg-gray-900 px-2 py-1 text-xs font-medium text-white shadow-overlay motion-reduce:animate-none',
            SIDE[side],
            className,
          )}
        >
          {content}
        </span>
      )}
    </span>
  );
}
