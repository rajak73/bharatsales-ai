import { Link } from 'react-router-dom';
import { cn } from '@bharatsales/ui';

/** The BharatSales mark: saffron "BS" tile with a navy label, same as the sidebar and favicon (public/icon.svg). */
export function BrandMark({ size = 'md', className }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizes = { sm: 'h-7 w-7 text-xs rounded-md', md: 'h-8 w-8 text-[0.8125rem] rounded-md', lg: 'h-10 w-10 text-base rounded-lg' };
  return (
    <span
      aria-hidden="true"
      className={cn('inline-flex shrink-0 items-center justify-center bg-saffron-500 font-display font-extrabold text-navy-900', sizes[size], className)}
    >
      BS
    </span>
  );
}

/** Logo + wordmark, linking home. `tone="light"` for dark (navy) backgrounds. */
export function BrandLogo({ tone = 'dark', to = '/', className }: { tone?: 'dark' | 'light'; to?: string; className?: string }) {
  return (
    <Link
      to={to}
      className={cn(
        'inline-flex items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        tone === 'light' ? 'focus-visible:ring-saffron-400 focus-visible:ring-offset-navy-900' : 'focus-visible:ring-primary-500',
        className,
      )}
    >
      <BrandMark />
      <span className={cn('font-display text-lg font-bold tracking-tight', tone === 'light' ? 'text-white' : 'text-navy-900')}>
        BharatSales <span className={tone === 'light' ? 'text-saffron-400' : 'text-primary-600'}>AI</span>
      </span>
    </Link>
  );
}
