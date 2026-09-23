import { useCallback, useEffect, useMemo, useState } from 'react';
import { OrdersService, OutletsService, TargetsService, UsersService } from '@bharatsales/api-client';
import { ShoppingCart, Store, Users, Target, IndianRupee } from 'lucide-react';
import {
  Card,
  CardBody,
  CardHeader,
  PageHeader,
  PageSection,
  StatCard,
  StatGrid,
  StatusPill,
  formatDate,
  formatINR,
  formatNumber,
  formatPercent,
} from '@bharatsales/ui';
import { ErrorState, getErrorMessage } from '../../../components/common/ErrorState';
import { BreakdownBars, CardSkeleton, ProgressMeter, RecentOrdersList, TrendBarChart, ViewAllLink, buildDailySeries, firstName, todayLabel } from './widgets';

const STATUS_ORDER = ['Submitted', 'Pending_Approval', 'Approved', 'Dispatched', 'Partial_Delivery', 'Delivered', 'Cancelled', 'Rejected'];

export function OrgAdminDashboard({ userName }: { userName: string }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [outlets, setOutlets] = useState<any[]>([]);
  const [targets, setTargets] = useState<any[]>([]);
  const [userCount, setUserCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    Promise.all([OrdersService.getOrders(), OutletsService.getOutlets(), TargetsService.getTargets(), UsersService.getUsers()])
      .then(([o, out, t, u]) => {
        setOrders(o || []);
        setOutlets(out || []);
        setTargets(t || []);
        setUserCount((u || []).length);
      })
      .catch((err) => {
        console.error('Failed to load dashboard data', err);
        setLoadError(getErrorMessage(err) ?? 'Failed to load dashboard data.');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const dailySales = useMemo(
    () =>
      buildDailySeries(
        orders,
        (o) => o.createdAt,
        (o) => o.totals?.grandTotal || 0,
        14,
        (n) => `${formatNumber(n)} order${n === 1 ? '' : 's'}`,
      ),
    [orders],
  );

  const header = (
    <PageHeader
      title={`Welcome back, ${firstName(userName)}`}
      description={`${todayLabel()} · Your organization's sales overview for today.`}
    />
  );

  if (loadError) {
    return (
      <PageSection>
        {header}
        <ErrorState title="Couldn't load your dashboard" message={loadError} onRetry={load} />
      </PageSection>
    );
  }

  const totalRevenue = orders.reduce((sum, o) => sum + (o.totals?.grandTotal || 0), 0);
  const totalTarget = targets.reduce((sum, t) => sum + (t.targetValue || 0), 0);
  const totalActual = targets.reduce((sum, t) => sum + (t.actualValue || 0), 0);
  const achievementPct = totalTarget > 0 ? Math.round((totalActual / totalTarget) * 100) : 0;

  const recentOrders = [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
  const statusMix = STATUS_ORDER.map((status) => ({ status, count: orders.filter((o) => o.status === status).length })).filter((s) => s.count > 0);

  return (
    <PageSection>
      {header}

      <StatGrid columns={4}>
        <StatCard label="Total orders" value={formatNumber(orders.length)} icon={<ShoppingCart />} loading={loading} />
        <StatCard
          label="Total sales value"
          value={formatINR(totalRevenue, { compact: true })}
          hint={orders.length > 0 ? `Avg ${formatINR(totalRevenue / orders.length, { compact: true })} per order` : undefined}
          icon={<IndianRupee />}
          tone="success"
          loading={loading}
        />
        <StatCard
          label="Active outlets"
          value={formatNumber(outlets.filter((o) => o.status === 'Active').length)}
          icon={<Store />}
          tone="info"
          loading={loading}
        />
        <StatCard label="Employees" value={formatNumber(userCount)} icon={<Users />} tone="neutral" loading={loading} />
      </StatGrid>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Sales value, last 14 days"
            description="Order value booked per day"
            actions={<ViewAllLink to="/dashboard/sales">Sales details</ViewAllLink>}
            divided
          />
          <CardBody>
            {loading ? <CardSkeleton rows={5} label="Loading chart" /> : <TrendBarChart data={dailySales} format="inr" label="Sales value per day for the last 14 days" />}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Target achievement" description="Organization-wide, current period" divided />
          <CardBody className="space-y-4">
            {loading ? (
              <CardSkeleton rows={2} label="Loading targets" />
            ) : (
              <>
                <div className="flex items-end justify-between gap-3">
                  <p className="font-display text-2xl font-bold tabular-nums tracking-tight text-gray-900">{formatPercent(achievementPct, { decimals: 0 })}</p>
                  <Target className="h-6 w-6 text-primary-600" aria-hidden="true" />
                </div>
                <ProgressMeter value={achievementPct} label="Organization-wide target achievement" />
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-foreground-subtle">Achieved</dt>
                    <dd className="font-medium tabular-nums text-gray-900">{formatINR(totalActual, { compact: true })}</dd>
                  </div>
                  <div className="text-right">
                    <dt className="text-foreground-subtle">Target</dt>
                    <dd className="font-medium tabular-nums text-gray-900">{formatINR(totalTarget, { compact: true })}</dd>
                  </div>
                </dl>
                {totalTarget === 0 && <p className="text-xs text-foreground-subtle">No targets set yet. Set targets to track progress here.</p>}
              </>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Recent orders" actions={<ViewAllLink to="/dashboard/sales" />} divided />
          {loading ? (
            <CardSkeleton rows={5} label="Loading recent orders" padded />
          ) : (
            <RecentOrdersList
              orders={recentOrders}
              subtitle={(o) => (o.createdAt ? formatDate(o.createdAt) : undefined)}
              emptyDescription="Orders booked by your field team will show up here."
            />
          )}
        </Card>

        <Card>
          <CardHeader title="Orders by status" divided />
          <CardBody>
            {loading ? (
              <CardSkeleton rows={3} label="Loading status breakdown" />
            ) : (
              <BreakdownBars
                emptyText="No orders yet."
                items={statusMix.map(({ status, count }) => ({ key: status, label: <StatusPill status={status} size="sm" />, value: count }))}
              />
            )}
          </CardBody>
        </Card>
      </div>
    </PageSection>
  );
}
