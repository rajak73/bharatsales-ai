import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { buttonClassName, cn, formatINR } from '@bharatsales/ui';

/**
 * Public plan catalogue shown on /pricing. Names, monthly prices and user
 * limits mirror the platform's own plan config (apps/api superadmin
 * PLAN_PRICES and platform-settings defaultPlanUserLimits); keep them in sync.
 * Every plan has the same modules; plans differ only by user limit.
 */
export interface Plan {
  id: string;
  name: string;
  tagline: string;
  /** Price per organisation per month in ₹. */
  price: number;
  /** Maximum active users; null = no limit. */
  users: number | null;
  cta: { label: string; to: string };
  featured?: boolean;
}

export const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    tagline: 'For a distributor or small brand with a handful of reps.',
    price: 9999,
    users: 10,
    cta: { label: 'Create account', to: '/signup' },
  },
  {
    id: 'growth',
    name: 'Growth',
    tagline: 'For regional brands with managers, reps and several distributors.',
    price: 24999,
    users: 50,
    cta: { label: 'Create account', to: '/signup' },
    featured: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'For large field teams with no cap on users.',
    price: 49999,
    users: null,
    cta: { label: 'Contact us', to: '/contact' },
  },
];

/** Modules included in every plan. */
export const INCLUDED_IN_ALL: string[] = [
  'Beats, attendance & GPS check-ins',
  'Order booking with GST & schemes',
  'Distributor orders, stock & deliveries',
  'Collections & credit limits',
  'Returns with approvals',
  'Targets, incentives & DSR',
  'Live map for managers',
  'Android app (works offline)',
];

export const usersLabel = (plan: Plan) => (plan.users === null ? 'Unlimited users' : `Up to ${plan.users} users`);

export function PlanCard({ plan, headingLevel = 'h3' }: { plan: Plan; headingLevel?: 'h2' | 'h3' }) {
  const Heading = headingLevel;
  const featured = !!plan.featured;
  return (
    <div
      className={cn(
        'relative flex flex-col rounded-xl border bg-white p-5',
        featured ? 'border-primary-600 shadow-overlay ring-1 ring-primary-600' : 'border-border shadow-soft',
      )}
    >
      <Heading className="font-display text-lg font-bold text-navy-900">{plan.name}</Heading>
      <p className="mt-1 text-sm text-foreground-muted sm:min-h-[2.5rem]">{plan.tagline}</p>
      <p className="mt-4 flex flex-wrap items-baseline gap-x-1">
        <span className="font-display text-3xl font-extrabold tracking-tight text-navy-900 tabular-nums">{formatINR(plan.price)}</span>
        <span className="text-sm text-foreground-subtle">/ organisation / month</span>
      </p>
      <p className="mt-3 flex gap-3 text-sm font-medium text-gray-900">
        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" aria-hidden="true" />
        {usersLabel(plan)}
      </p>
      <p className="mt-2 flex flex-1 gap-3 text-sm text-gray-700">
        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" aria-hidden="true" />
        All modules, web dashboard and Android app
      </p>
      <Link
        to={plan.cta.to}
        className={buttonClassName({ variant: featured ? 'primary' : 'outline', fullWidth: true, className: 'mt-5' })}
        aria-label={`${plan.cta.label} (${plan.name} plan)`}
      >
        {plan.cta.label}
      </Link>
    </div>
  );
}
