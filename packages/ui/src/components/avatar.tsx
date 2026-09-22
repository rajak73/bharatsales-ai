import * as React from 'react';
import { cn } from '../utils/cn';
import { getInitials } from '../utils/format';

const SIZES = {
  xs: 'h-6 w-6 text-2xs',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
};

// Soft, AA-contrast tints picked deterministically from the name.
const TINTS = [
  'bg-primary-100 text-primary-800',
  'bg-saffron-100 text-saffron-800',
  'bg-success-100 text-success-800',
  'bg-violet-100 text-violet-800',
  'bg-info-100 text-info-800',
  'bg-rose-100 text-rose-800',
  'bg-teal-100 text-teal-800',
];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  name?: string | null;
  src?: string | null;
  size?: keyof typeof SIZES;
  shape?: 'circle' | 'square';
  /** Presence dot. */
  status?: 'online' | 'away' | 'offline';
}

/** Photo, or initials on a tint derived from the name. */
export function Avatar({ name, src, size = 'md', shape = 'circle', status, className, ...props }: AvatarProps) {
  const [failed, setFailed] = React.useState(false);
  const showImg = src && !failed;
  const radius = shape === 'circle' ? 'rounded-full' : 'rounded-lg';
  return (
    <span className={cn('relative inline-flex shrink-0', className)} {...props}>
      <span
        className={cn('inline-flex items-center justify-center overflow-hidden font-semibold', radius, SIZES[size], !showImg && TINTS[hash(name || '') % TINTS.length])}
        role="img"
        aria-label={name || 'User'}
      >
        {showImg ? (
          <img src={src!} alt="" className="h-full w-full object-cover" onError={() => setFailed(true)} loading="lazy" />
        ) : (
          <span aria-hidden="true">{getInitials(name)}</span>
        )}
      </span>
      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-white',
            status === 'online' ? 'bg-success-500' : status === 'away' ? 'bg-warning-500' : 'bg-gray-400',
          )}
          aria-label={status}
        />
      )}
    </span>
  );
}
