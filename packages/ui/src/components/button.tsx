import * as React from 'react';
import { cn } from '../utils/cn';
import { Spinner } from './spinner';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'accent' | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** `destructive` is a legacy alias of `danger`. */
  variant?: ButtonVariant | 'destructive';
  size?: ButtonSize;
  /** Shows a spinner, disables the button and sets aria-busy. Keep the label (e.g. "Saving…"). */
  loading?: boolean;
  /** Icon element rendered before the label (e.g. <Plus />). Replaced by the spinner while loading. */
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'bg-primary-600 text-white shadow-xs hover:bg-primary-700 active:bg-primary-800',
  secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300',
  outline: 'border border-border-strong bg-white text-gray-700 shadow-xs hover:bg-gray-50 hover:text-gray-900 active:bg-gray-100',
  ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200',
  danger: 'bg-danger-600 text-white shadow-xs hover:bg-danger-700 active:bg-danger-800 focus-visible:ring-danger-500',
  // Saffron CTA — one per view ("+ New order", "Book a Demo"). Navy label: white on #FF8A1F fails contrast.
  accent: 'bg-saffron-500 font-semibold text-navy-900 shadow-xs hover:bg-saffron-600 active:bg-saffron-700 focus-visible:ring-saffron-500',
  link: 'bg-transparent text-primary-700 underline-offset-4 hover:underline px-0 h-auto min-h-0',
};

// Compact on desktop (sm 32px / md 36px / lg 40px, matching Input heights);
// phones keep ≥44px targets for md/lg and ≥40px for sm.
export const buttonSizes: Record<ButtonSize, string> = {
  sm: 'h-10 sm:h-8 px-3 text-sm sm:text-xs gap-1.5 [&_svg]:h-4 [&_svg]:w-4',
  md: 'h-11 sm:h-9 px-3.5 text-sm gap-2 [&_svg]:h-4 [&_svg]:w-4',
  lg: 'h-12 sm:h-10 px-5 text-sm sm:text-base gap-2 [&_svg]:h-[18px] [&_svg]:w-[18px]',
};

export const buttonBase =
  'inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap rounded-lg font-medium transition-colors ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ' +
  'disabled:cursor-not-allowed disabled:opacity-50 aria-busy:cursor-wait';

/** Returns the class string for a button look — use on <Link> / <a> to make it look like a Button. */
export function buttonClassName({
  variant = 'primary',
  size = 'md',
  fullWidth,
  className,
}: { variant?: ButtonVariant | 'destructive'; size?: ButtonSize; fullWidth?: boolean; className?: string } = {}) {
  const v: ButtonVariant = variant === 'destructive' ? 'danger' : variant;
  return cn(buttonBase, buttonSizes[size], buttonVariants[v], fullWidth && 'w-full', className);
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = 'primary', size = 'md', loading = false, leftIcon, rightIcon, fullWidth, disabled, type = 'button', children, ...props },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={buttonClassName({ variant, size, fullWidth, className })}
        {...props}
      >
        {loading ? <Spinner size="sm" label={null} /> : leftIcon}
        {children}
        {!loading && rightIcon}
      </button>
    );
  },
);
Button.displayName = 'Button';

export interface IconButtonProps extends Omit<ButtonProps, 'leftIcon' | 'rightIcon' | 'children' | 'fullWidth'> {
  /** Required accessible name (also shown as the native tooltip). */
  'aria-label': string;
  icon: React.ReactNode;
  /** Suppress the native title tooltip (e.g. when wrapped in <Tooltip>). */
  noTitle?: boolean;
}

const ICON_SIZES: Record<ButtonSize, string> = {
  sm: 'h-10 w-10 sm:h-8 sm:w-8 [&_svg]:h-4 [&_svg]:w-4',
  md: 'h-11 w-11 sm:h-9 sm:w-9 [&_svg]:h-[18px] [&_svg]:w-[18px]',
  lg: 'h-12 w-12 sm:h-10 sm:w-10 [&_svg]:h-5 [&_svg]:w-5',
};

/** Square icon-only button. `aria-label` is required. Defaults to the ghost variant. */
const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant = 'ghost', size = 'md', loading, icon, disabled, type = 'button', noTitle, title, ...props }, ref) => {
    const v: ButtonVariant = variant === 'destructive' ? 'danger' : variant;
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        title={noTitle ? undefined : title ?? props['aria-label']}
        className={cn(buttonBase, buttonVariants[v], 'p-0', ICON_SIZES[size], v === 'ghost' && 'text-gray-500', className)}
        {...props}
      >
        {loading ? <Spinner size="sm" label={null} /> : icon}
      </button>
    );
  },
);
IconButton.displayName = 'IconButton';

export { Button, IconButton };
