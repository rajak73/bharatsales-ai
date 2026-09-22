import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnalyticsService } from '@bharatsales/api-client';
import { Truck, Boxes, IndianRupee, PackageCheck } from 'lucide-react';
import { Card, CardHeader, PageHeader, PageSection, StatCard, StatGrid, buttonClassName, formatDate, formatINR, formatNumber } from '@bharatsales/ui';
import { ErrorState, getErrorMessage } from '../../../components/common/ErrorState';
import { CardSkeleton, RecentOrdersList, ViewAllLink, firstName, todayLabel } from './widgets';

export function DistributorDashboard({ userName }: { userName: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    AnalyticsService.getDashboardData()
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((err) => {
        if (cancelled) return;
        setData(null);
        setLoadError(getErrorMessage(err) ?? 'Could not load your dashboard.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const kpis = data?.kpis || {};

  return (
    <PageSection>
      <PageHeader
        title={`Welcome back, ${firstName(userName)}`}
        description={`${todayLabel()} · Your fulfilment overview for today.`}
        actions={
          <Link to="/dashboard/deliveries" className={buttonClassName({ variant: 'accent' })}>
            <Truck className="h-4 w-4" aria-hidden="true" />
            Manage deliveries
          </Link>
        }
      />

      {loadError && !loading && (
        <ErrorState title="Couldn't load your dashboard" message={loadError} onRetry={() => setReloadKey((k) => k + 1)} />
      )}

      <StatGrid columns={4}>
        <StatCard label="Pending deliveries" value={formatNumber(kpis.pendingDeliveries ?? 0)} icon={<Truck />} tone="warning" loading={loading} />
        <StatCard label="In transit" value={formatNumber(kpis.inTransit ?? 0)} icon={<PackageCheck />} tone="info" loading={loading} />
        <StatCard
          label="Outstanding receivables"
          value={formatINR(kpis.outstandingReceivables ?? 0, { compact: true })}
          hint={kpis.outletsServed ? `From ${formatNumber(kpis.outletsServed)} outlet${kpis.outletsServed === 1 ? '' : 's'} served` : undefined}
          icon={<IndianRupee />}
          tone="danger"
          loading={loading}
        />
        <StatCard label="Stock units on hand" value={formatNumber(kpis.totalStockValue ?? 0)} icon={<Boxes />} tone="success" loading={loading} />
      </StatGrid>

      <Card>
        <CardHeader title="Recent orders" description="Latest orders from your outlets" actions={<ViewAllLink to="/dashboard/orders" />} divided />
        {loading ? (
          <CardSkeleton rows={4} label="Loading recent orders" padded />
        ) : (
          <RecentOrdersList
            orders={data?.recentOrders || []}
            subtitle={(o) => (o.createdAt ? formatDate(o.createdAt) : undefined)}
            emptyDescription="New orders from reps will appear here for you to confirm."
          />
        )}
      </Card>
    </PageSection>
  );
}
