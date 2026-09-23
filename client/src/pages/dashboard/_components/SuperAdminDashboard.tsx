import { useEffect, useState } from 'react';
import { SuperadminService } from '@bharatsales/api-client';
import { Building2, CheckCircle, IndianRupee, Users } from 'lucide-react';
import {
  Avatar,
  Badge,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  PageHeader,
  PageSection,
  StatCard,
  StatGrid,
  StatusPill,
  formatDate,
  formatINR,
  formatNumber,
} from '@bharatsales/ui';
import { ErrorState, getErrorMessage } from '../../../components/common/ErrorState';
import { BreakdownBars, CardSkeleton, ViewAllLink, firstName, todayLabel } from './widgets';

export function SuperAdminDashboard({ userName }: { userName: string }) {
  const [dashboard, setDashboard] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    Promise.allSettled([SuperadminService.getPlatformDashboard(), SuperadminService.getMetrics()])
      .then(([d, m]) => {
        if (cancelled) return;
        setDashboard(d.status === 'fulfilled' ? d.value : null);
        setMetrics(m.status === 'fulfilled' ? m.value : null);
        const failed = [d, m].find((r): r is PromiseRejectedResult => r.status === 'rejected');
        if (failed) setLoadError(getErrorMessage(failed.reason) ?? 'Some platform data could not be loaded.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const signups: any[] = dashboard?.recentSignups || [];
  const plans: any[] = metrics?.plans || [];

  return (
    <PageSection>
      <PageHeader
        title={`Welcome back, ${firstName(userName)}`}
        description={`${todayLabel()} · Platform-wide overview across every organization.`}
      />

      {loadError && !loading && (
        <ErrorState title="Couldn't load all platform data" message={loadError} onRetry={() => setReloadKey((k) => k + 1)} />
      )}

      <StatGrid columns={4}>
        <StatCard label="Total organizations" value={formatNumber(dashboard?.totalTenants ?? 0)} icon={<Building2 />} loading={loading} />
        <StatCard label="Active organizations" value={formatNumber(dashboard?.activeTenants ?? 0)} icon={<CheckCircle />} tone="success" loading={loading} />
        <StatCard
          label="Monthly recurring revenue"
          value={formatINR(metrics?.mrr ?? 0, { compact: true })}
          hint={metrics?.mrr ? `${formatINR(metrics.mrr * 12, { compact: true })} annual run-rate` : undefined}
          icon={<IndianRupee />}
          tone="accent"
          loading={loading}
        />
        <StatCard label="Total platform users" value={formatNumber(dashboard?.totalUsers ?? 0)} icon={<Users />} tone="info" loading={loading} />
      </StatGrid>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Recent signups"
            description="Last 7 days"
            actions={<ViewAllLink to="/dashboard/superadmin/organizations">Organizations</ViewAllLink>}
            divided
          />
          {loading ? (
            <CardSkeleton rows={4} label="Loading recent signups" padded />
          ) : signups.length === 0 ? (
            <EmptyState size="compact" icon={<Building2 />} title="No new organizations this week" />
          ) : (
            <ul className="divide-y divide-border">
              {signups.map((org, idx) => (
                <li key={idx} className="flex items-center gap-3 px-4 py-2.5">
                  <Avatar name={org.name} size="sm" shape="square" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">{org.name}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                      {org.plan && (
                        <Badge size="sm" tone="primary">
                          {org.plan}
                        </Badge>
                      )}
                      {org.status && <StatusPill status={org.status} size="sm" />}
                    </div>
                  </div>
                  <span className="shrink-0 text-xs text-foreground-subtle">{formatDate(org.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Plan breakdown" description="Organizations per subscription plan" divided />
          <CardBody>
            {loading ? (
              <CardSkeleton rows={3} label="Loading plan breakdown" />
            ) : (
              <BreakdownBars
                emptyText="No subscription data yet."
                items={plans.map((plan) => ({
                  key: String(plan.name),
                  label: <span className="text-gray-700">{plan.name}</span>,
                  value: Number(plan.tenants) || 0,
                  valueLabel: `${formatNumber(plan.tenants ?? 0)} orgs`,
                }))}
              />
            )}
          </CardBody>
        </Card>
      </div>
    </PageSection>
  );
}
