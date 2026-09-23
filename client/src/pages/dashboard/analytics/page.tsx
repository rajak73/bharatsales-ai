import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { AnalyticsService } from '@bharatsales/api-client';
import { Users, ShoppingCart, IndianRupee, Store, RefreshCw, BarChart2, Activity, Map as MapIcon, Trophy } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  DataTable,
  EmptyState,
  PageHeader,
  PageSection,
  Skeleton,
  StatCard,
  StatGrid,
  formatINR,
  formatNumber,
  CHART_AXIS_TICK,
  CHART_THEME,
  CHART_TOOLTIP_STYLE,
} from '@bharatsales/ui';
import type { DataTableColumn } from '@bharatsales/ui';
import { ErrorState } from '../../../components/common/ErrorState';

const COLORS = CHART_THEME.categorical;
const GRID = CHART_THEME.grid;
const AXIS_TICK = CHART_AXIS_TICK;
const TOOLTIP_STYLE = CHART_TOOLTIP_STYLE;

interface RepRow {
  name: string;
  orders?: number;
  revenue?: number;
  visits?: number;
}

const repColumns: DataTableColumn<RepRow>[] = [
  { id: 'name', header: 'Name', accessor: 'name', sortable: true, primary: true, cell: (r) => <span className="font-medium text-gray-900">{r.name}</span> },
  { id: 'orders', header: 'Orders', accessor: (r) => r.orders ?? -1, sortable: true, align: 'right', cell: (r) => formatNumber(r.orders) },
  { id: 'revenue', header: 'Revenue', accessor: (r) => Number(r.revenue ?? 0), sortable: true, align: 'right', cell: (r) => (r.revenue ? formatINR(Number(r.revenue)) : '—') },
  { id: 'visits', header: 'Visits', accessor: (r) => r.visits ?? -1, sortable: true, align: 'right', hideBelow: 'sm', cell: (r) => formatNumber(r.visits) },
];

function ChartEmpty({ children }: { children: ReactNode }) {
  return <div className="flex h-48 items-center justify-center text-sm text-foreground-subtle">{children}</div>;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      setRefreshing(true);
      const result = await AnalyticsService.getDashboardData();
      setData(result);
      setError('');
    } catch (err: any) {
      setError('Failed to load analytics. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const header = (
    <PageHeader
      title="Analytics"
      description="Performance across your organization: revenue, orders, outlets and reps."
      actions={
        <Button variant="outline" leftIcon={<RefreshCw />} onClick={fetchData} loading={refreshing && !loading}>
          Refresh
        </Button>
      }
    />
  );

  if (error) {
    return (
      <PageSection>
        {header}
        <ErrorState title="Couldn't load analytics" message={error} onRetry={fetchData} />
      </PageSection>
    );
  }

  const kpis = data?.kpis;
  const salesData: any[] = data?.salesData ?? [];
  const topProducts: any[] = data?.topProducts ?? [];
  const zones: any[] = data?.zonePerformance ?? [];
  const topReps: RepRow[] = data?.topSalesReps ?? [];
  const zoneMax = Math.max(1, ...zones.slice(0, 5).map((z) => Number(z.revenue || 0)));

  return (
    <PageSection>
      {header}

      <StatGrid columns={4}>
        <StatCard
          label="Total revenue"
          value={kpis?.totalRevenue ? formatINR(kpis.totalRevenue, { compact: true }) : '—'}
          icon={<IndianRupee />}
          tone="success"
          loading={loading}
          delta={typeof kpis?.revenueGrowth === 'number' ? { value: kpis.revenueGrowth, label: 'vs last month' } : undefined}
        />
        <StatCard
          label="Total orders"
          value={kpis?.totalOrders != null ? formatNumber(kpis.totalOrders) : '—'}
          icon={<ShoppingCart />}
          tone="primary"
          loading={loading}
          delta={typeof kpis?.orderGrowth === 'number' ? { value: kpis.orderGrowth, label: 'vs last month' } : undefined}
        />
        <StatCard label="Active outlets" value={kpis?.activeOutlets != null ? formatNumber(kpis.activeOutlets) : '—'} icon={<Store />} tone="info" loading={loading} />
        <StatCard label="Active reps" value={kpis?.activeReps != null ? formatNumber(kpis.activeReps) : '—'} icon={<Users />} tone="neutral" loading={loading} />
      </StatGrid>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title={<span className="flex items-center gap-2"><Activity className="h-4 w-4 text-primary-600" aria-hidden="true" />Revenue trend</span>} description="Daily revenue, last 7 days" />
          <CardBody>
            {loading ? (
              <Skeleton className="h-56 w-full" />
            ) : salesData.length > 0 ? (
              <div role="img" aria-label={`Line chart of monthly revenue over ${salesData.length} months`}>
                <ResponsiveContainer width="100%" height={224}>
                  <LineChart data={salesData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke={GRID} />
                    <XAxis dataKey="month" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: GRID }} />
                    <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={56} tickFormatter={(v) => formatINR(Number(v), { compact: true })} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(val: any) => [formatINR(Number(val)), 'Revenue']} />
                    <Line type="monotone" dataKey="revenue" stroke={COLORS[0]} strokeWidth={2} dot={{ fill: COLORS[0], r: 4, strokeWidth: 2, stroke: CHART_THEME.surface }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <ChartEmpty>No sales recorded yet</ChartEmpty>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={<span className="flex items-center gap-2"><BarChart2 className="h-4 w-4 text-primary-600" aria-hidden="true" />Top products</span>} description="By revenue" />
          <CardBody>
            {loading ? (
              <div className="space-y-3">
                {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-9 w-full" />)}
              </div>
            ) : topProducts.length > 0 ? (
              <ol className="space-y-3">
                {topProducts.slice(0, 5).map((p: any, idx: number) => (
                  <li key={p.productId || p.name || idx} className="flex items-center gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-700 tabular-nums">
                      {idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">{p.name || p.sku || p.productId || 'Unknown product'}</p>
                      <p className="truncate text-xs text-foreground-subtle">
                        {formatNumber(p.sales ?? p.orders ?? 0)} units{p.sku && p.sku !== p.name ? ` · ${p.sku}` : ''}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 tabular-nums">{p.revenue ? formatINR(Number(p.revenue), { compact: true }) : '—'}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <ChartEmpty>No product sales yet</ChartEmpty>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Orders by day" description="Orders placed, last 7 days" />
          <CardBody>
            {loading ? (
              <Skeleton className="h-52 w-full" />
            ) : salesData.length > 0 ? (
              <div role="img" aria-label={`Bar chart of orders per month over ${salesData.length} months`}>
                <ResponsiveContainer width="100%" height={208}>
                  <BarChart data={salesData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke={GRID} />
                    <XAxis dataKey="month" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: GRID }} />
                    <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={40} allowDecimals={false} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: CHART_THEME.cursor }} formatter={(val: any) => [formatNumber(Number(val)), 'Orders']} />
                    <Bar dataKey="orders" fill={COLORS[0]} radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <ChartEmpty>No orders yet</ChartEmpty>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={<span className="flex items-center gap-2"><MapIcon className="h-4 w-4 text-primary-600" aria-hidden="true" />Zone performance</span>} description="Revenue by zone" />
          <CardBody>
            {loading ? (
              <div className="space-y-4">
                {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full" />)}
              </div>
            ) : zones.length > 0 ? (
              <ul className="space-y-4">
                {zones.slice(0, 5).map((z: any, i: number) => {
                  const revenue = Number(z.revenue || 0);
                  return (
                    <li key={z.zone || i}>
                      <div className="mb-1.5 flex items-center justify-between gap-2 text-sm">
                        <span className="truncate text-gray-700">{z.zone}</span>
                        <span className="font-medium text-gray-900 tabular-nums">{formatINR(revenue)}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-gray-100" aria-hidden="true">
                        <div className="h-full rounded-full" style={{ width: `${(revenue / zoneMax) * 100}%`, backgroundColor: COLORS[0] }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <ChartEmpty>No zone data yet</ChartEmpty>
            )}
          </CardBody>
        </Card>
      </div>

      {(loading || topReps.length > 0) && (
        <section aria-labelledby="top-reps" className="space-y-3">
          <h2 id="top-reps" className="flex items-center gap-2 text-base font-semibold text-gray-900">
            <Trophy className="h-4 w-4 text-primary-600" aria-hidden="true" />
            Top sales reps
          </h2>
          <DataTable
            caption="Top sales reps"
            itemLabel="reps"
            data={topReps}
            columns={repColumns}
            getRowId={(r, i) => `${r.name}-${i}`}
            loading={loading}
            loadingRows={5}
            initialSort={{ id: 'revenue', direction: 'desc' }}
            pagination={false}
            emptyState={<EmptyState size="compact" icon={<Users />} title="No rep activity yet" />}
          />
        </section>
      )}
    </PageSection>
  );
}
