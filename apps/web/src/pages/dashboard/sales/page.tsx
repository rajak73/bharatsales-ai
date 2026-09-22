import { useState, useEffect, useMemo } from 'react';
import { OrdersService, OutletsService } from '@bharatsales/api-client';
import type { Order, Outlet } from '@bharatsales/shared-types';
import {
  Card,
  CardBody,
  CardHeader,
  DataTable,
  type DataTableColumn,
  EmptyState,
  LoadingRegion,
  PageHeader,
  PageSection,
  Skeleton,
  StatCard,
  StatGrid,
  StatusPill,
  formatDate,
  formatINR,
  formatNumber,
} from '@bharatsales/ui';
import { Clock, IndianRupee, ShoppingCart, TrendingUp } from 'lucide-react';
import { ErrorState, getErrorMessage } from '../../../components/common/ErrorState';
import { BreakdownBars, TrendBarChart, buildDailySeries } from '../_components/widgets';

const STATUS_ORDER = ['Draft', 'Submitted', 'Pending_Approval', 'Hold_Credit', 'Hold_Stock', 'Approved', 'Dispatched', 'Partial_Delivery', 'Delivered', 'Cancelled', 'Rejected'];

export default function SalesPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const [orderData, outletData] = await Promise.all([OrdersService.getOrders(), OutletsService.getOutlets()]);
      setOrders(orderData || []);
      setOutlets(outletData || []);
    } catch (error) {
      console.error('Failed to fetch sales data:', error);
      setLoadError(getErrorMessage(error) ?? 'Failed to load sales data.');
    } finally {
      setLoading(false);
    }
  };

  const outletName = (outletId: string) => outlets.find((o) => o.id === outletId)?.name || outletId;

  const totalOrders = orders.length;
  const totalSalesValue = orders.reduce((sum, o) => sum + (o.totals?.grandTotal || 0), 0);
  const pendingApproval = orders.filter((o) => o.status === 'Submitted' || o.status === 'Pending_Approval').length;
  const avgOrderValue = totalOrders > 0 ? totalSalesValue / totalOrders : 0;

  const statusBreakdown = STATUS_ORDER.map((status) => ({ status, count: orders.filter((o) => o.status === status).length })).filter(
    (s) => s.count > 0,
  );

  const recentOrders = [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10);

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

  const columns: DataTableColumn<Order>[] = [
    {
      id: 'order',
      header: 'Order',
      accessor: 'orderNumber',
      primary: true,
      cell: (o) => (
        <div>
          <p className="font-medium text-gray-900">{o.orderNumber}</p>
          <p className="text-xs text-foreground-subtle">{formatDate(o.createdAt)}</p>
        </div>
      ),
    },
    { id: 'outlet', header: 'Outlet', accessor: (o) => outletName(o.outletId), cell: (o) => <span className="text-gray-700">{outletName(o.outletId)}</span> },
    { id: 'status', header: 'Status', accessor: 'status', cell: (o) => <StatusPill status={o.status} /> },
    {
      id: 'value',
      header: 'Value',
      accessor: (o) => o.totals?.grandTotal || 0,
      align: 'right',
      cell: (o) => <span className="font-medium tabular-nums text-gray-900">{formatINR(o.totals?.grandTotal || 0)}</span>,
    },
  ];

  const initialLoad = loading && orders.length === 0;

  return (
    <PageSection>
      <PageHeader title="Sales" description="Order volume and sales activity across your organization." />

      {loadError && !initialLoad ? (
        <ErrorState title="Couldn't load sales data" message={loadError} onRetry={fetchData} />
      ) : (
        <>
          <StatGrid columns={4}>
            <StatCard label="Total orders" value={formatNumber(totalOrders)} icon={<ShoppingCart />} loading={initialLoad} />
            <StatCard
              label="Total sales value"
              value={formatINR(totalSalesValue, { compact: true })}
              icon={<TrendingUp />}
              tone="success"
              loading={initialLoad}
            />
            <StatCard label="Pending approval" value={formatNumber(pendingApproval)} icon={<Clock />} tone="warning" loading={initialLoad} />
            <StatCard
              label="Average order value"
              value={formatINR(Math.round(avgOrderValue))}
              icon={<IndianRupee />}
              tone="info"
              loading={initialLoad}
            />
          </StatGrid>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader title="Sales value, last 14 days" description="Order value booked per day" divided />
              <CardBody>
                {initialLoad ? (
                  <LoadingRegion label="Loading chart">
                    <Skeleton className="h-60" />
                  </LoadingRegion>
                ) : (
                  <TrendBarChart data={dailySales} format="inr" label="Sales value per day for the last 14 days" />
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Orders by status" divided />
              <CardBody>
                {initialLoad ? (
                  <LoadingRegion label="Loading status breakdown" className="space-y-4">
                    <Skeleton className="h-6" />
                    <Skeleton className="h-6" />
                    <Skeleton className="h-6" />
                  </LoadingRegion>
                ) : (
                  <BreakdownBars
                    emptyText="No orders yet."
                    items={statusBreakdown.map(({ status, count }) => ({
                      key: status,
                      label: <StatusPill status={status} size="sm" />,
                      value: count,
                    }))}
                  />
                )}
              </CardBody>
            </Card>
          </div>

          <Card>
            <CardHeader title="Recent orders" description="The 10 most recent orders" divided />
            <DataTable
              caption="Recent orders"
              itemLabel="orders"
              data={recentOrders}
              columns={columns}
              getRowId={(o) => String(o.id)}
              loading={initialLoad}
              bordered={false}
              pagination={false}
              mobileLayout="cards"
              emptyState={
                <EmptyState
                  size="compact"
                  icon={<ShoppingCart />}
                  title="No orders yet"
                  description="Orders booked by your field team will show up here."
                />
              }
            />
          </Card>
        </>
      )}
    </PageSection>
  );
}
