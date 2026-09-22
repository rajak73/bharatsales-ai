import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { SuperadminService } from '@bharatsales/api-client';
import { TrendingUp, ShoppingCart, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  Card,
  CardBody,
  CardHeader,
  PageHeader,
  PageSection,
  Skeleton,
  StatCard,
  StatGrid,
  formatDate,
  formatINR,
  formatNumber,
  CHART_AXIS_TICK,
  CHART_THEME,
  CHART_TOOLTIP_STYLE,
} from '@bharatsales/ui';
import { ErrorState, getErrorMessage } from '../../../../components/common/ErrorState';

const BAR = CHART_THEME.series;
const GRID = CHART_THEME.grid;
const AXIS_TICK = CHART_AXIS_TICK;
const TOOLTIP_STYLE = CHART_TOOLTIP_STYLE;

function Empty({ children }: { children: ReactNode }) {
  return <div className="flex h-40 items-center justify-center text-sm text-foreground-subtle">{children}</div>;
}

function RankedList({ rows }: { rows: { key: string; label: string; value: number; display: string; meta?: string }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ol className="space-y-4">
      {rows.map((r, idx) => (
        <li key={r.key}>
          <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate text-gray-700">
              <span className="mr-2 text-foreground-subtle tabular-nums">{idx + 1}.</span>
              {r.label}
            </span>
            <span className="shrink-0 text-right font-medium text-gray-900 tabular-nums">
              {r.display}
              {r.meta && <span className="ml-1 font-normal text-foreground-subtle">{r.meta}</span>}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-gray-100" aria-hidden="true">
            <div className="h-full rounded-full bg-primary-500" style={{ width: `${(r.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function PlatformAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loginStats, setLoginStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    setLoading(true);
    setLoadError('');
    Promise.all([
      SuperadminService.getPlatformAnalytics(),
      SuperadminService.getLoginStatistics(),
    ])
      .then(([analytics, logins]) => {
        setData(analytics);
        setLoginStats(logins);
      })
      .catch((err) => {
        console.error('Failed to load platform analytics:', err);
        setLoadError(getErrorMessage(err) ?? "Couldn't load platform analytics. Check your connection and try again.");
      })
      .finally(() => setLoading(false));
  }, [reloadKey]);

  const header = <PageHeader title="Platform analytics" description="Aggregate activity across every organization on the platform." />;

  if (loadError) {
    return (
      <PageSection>
        {header}
        <ErrorState title="Couldn't load platform analytics" message={loadError} onRetry={() => setReloadKey((k) => k + 1)} />
      </PageSection>
    );
  }

  const growth: any[] = data?.tenantGrowth ?? [];
  const topTenants: any[] = data?.topTenants ?? [];
  const dailyLogins: any[] = loginStats?.dailyLogins ?? [];
  const byOrg: any[] = loginStats?.byOrg ?? [];

  const chartSkeleton = <Skeleton className="h-52 w-full" />;
  const listSkeleton = (
    <div className="space-y-4">
      {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full" />)}
    </div>
  );

  return (
    <PageSection>
      {header}

      <StatGrid columns={3}>
        <StatCard label="Total revenue" value={formatINR(data?.totalRevenue || 0, { compact: true })} icon={<TrendingUp />} tone="success" loading={loading} />
        <StatCard label="Total orders" value={formatNumber(data?.totalOrders || 0)} icon={<ShoppingCart />} tone="primary" loading={loading} />
        <StatCard label="Active users" value={formatNumber(data?.activeUsers || 0)} icon={<Users />} tone="info" loading={loading} />
      </StatGrid>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="New organizations" description="Signups per month, last 6 months" />
          <CardBody>
            {loading ? chartSkeleton : growth.length === 0 ? (
              <Empty>No new organizations in this period.</Empty>
            ) : (
              <div role="img" aria-label={`Bar chart of new organizations per month: ${growth.map((g) => `${g.month} ${g.count}`).join(', ')}`}>
                <ResponsiveContainer width="100%" height={208}>
                  <BarChart data={growth} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke={GRID} />
                    <XAxis dataKey="month" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: GRID }} />
                    <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={32} allowDecimals={false} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: CHART_THEME.cursor }} formatter={(v: any) => [formatNumber(Number(v)), 'New organizations']} />
                    <Bar dataKey="count" fill={BAR} radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Top organizations by revenue" />
          <CardBody>
            {loading ? listSkeleton : topTenants.length === 0 ? (
              <Empty>No order activity yet.</Empty>
            ) : (
              <RankedList
                rows={topTenants.map((t) => ({
                  key: t.organizationId,
                  label: t.name,
                  value: Number(t.revenue) || 0,
                  display: formatINR(Number(t.revenue) || 0, { compact: true }),
                  meta: `· ${formatNumber(t.orderCount)} orders`,
                }))}
              />
            )}
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Login activity" description="Daily logins, last 30 days" />
          <CardBody>
            {loading ? chartSkeleton : dailyLogins.length === 0 ? (
              <Empty>No login activity in this period.</Empty>
            ) : (
              <div role="img" aria-label={`Bar chart of daily logins over ${dailyLogins.length} days`}>
                <ResponsiveContainer width="100%" height={208}>
                  <BarChart data={dailyLogins} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke={GRID} />
                    <XAxis
                      dataKey="date"
                      tick={AXIS_TICK}
                      tickLine={false}
                      axisLine={{ stroke: GRID }}
                      minTickGap={24}
                      tickFormatter={(d) => formatDate(d, 'short').slice(0, 5)}
                    />
                    <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={32} allowDecimals={false} />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      cursor={{ fill: CHART_THEME.cursor }}
                      labelFormatter={(d) => formatDate(d as string)}
                      formatter={(v: any) => [formatNumber(Number(v)), 'Logins']}
                    />
                    <Bar dataKey="count" fill={BAR} radius={[3, 3, 0, 0]} maxBarSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Logins by organization" description="Last 30 days" />
          <CardBody>
            {loading ? listSkeleton : byOrg.length === 0 ? (
              <Empty>No login activity in this period.</Empty>
            ) : (
              <RankedList
                rows={byOrg.map((o) => ({
                  key: o.organizationId,
                  label: o.organizationName,
                  value: Number(o.count) || 0,
                  display: formatNumber(o.count),
                  meta: 'logins',
                }))}
              />
            )}
          </CardBody>
        </Card>
      </div>
    </PageSection>
  );
}
