import { useState, useEffect } from 'react';
import { TrendingUp, Target, IndianRupee, MapPin, Printer, Users } from 'lucide-react';
import { PerformanceService } from '@bharatsales/api-client';
import {
  Button,
  DataTable,
  EmptyState,
  Input,
  PageHeader,
  PageSection,
  StatCard,
  StatGrid,
  formatDate,
  formatINR,
  formatNumber,
} from '@bharatsales/ui';
import type { DataTableColumn } from '@bharatsales/ui';
import { useCurrentUser } from '../../../../contexts/CurrentUserContext';
import { ErrorState, getErrorMessage } from '../../../../components/common/ErrorState';

interface RepRow {
  userId: string;
  name: string;
  totalVisits: number;
  productiveVisits: number;
  ordersCount: number;
  totalOrderValue: number;
  totalCollections: number;
}

const repColumns: DataTableColumn<RepRow>[] = [
  { id: 'name', header: 'Rep', accessor: 'name', sortable: true, primary: true, cell: (r) => <span className="font-medium text-gray-900">{r.name}</span> },
  { id: 'visits', header: 'Visits', accessor: 'totalVisits', sortable: true, align: 'right', cell: (r) => formatNumber(r.totalVisits) },
  { id: 'productive', header: 'Productive', accessor: 'productiveVisits', sortable: true, align: 'right', hideBelow: 'md', cell: (r) => formatNumber(r.productiveVisits) },
  { id: 'orders', header: 'Orders', accessor: 'ordersCount', sortable: true, align: 'right', hideBelow: 'md', cell: (r) => formatNumber(r.ordersCount) },
  { id: 'value', header: 'Order value', accessor: 'totalOrderValue', sortable: true, align: 'right', cell: (r) => formatINR(r.totalOrderValue) },
  { id: 'collections', header: 'Collections', accessor: 'totalCollections', sortable: true, align: 'right', cell: (r) => formatINR(r.totalCollections) },
];

export default function DSRPage() {
  const [metrics, setMetrics] = useState({
    totalVisits: 0,
    productiveVisits: 0,
    totalOrderValue: 0,
    totalCollections: 0,
    ordersCount: 0
  });
  const [repBreakdown, setRepBreakdown] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  // Role comes from the dashboard layout's decoded session, so it is known
  // before the first fetch (no default-then-correct double request).
  const { role } = useCurrentUser();
  const isManager = role === 'Sales Manager';
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    // Ignore responses for a date/role that is no longer selected.
    let stale = false;
    const fetchDSR = async () => {
      try {
        setLoading(true);
        setLoadError('');
        const data = isManager
          ? await PerformanceService.getTeamDSR(date)
          : await PerformanceService.getDSR(date);
        if (stale) return;
        if (data && data.metrics) {
          setMetrics(data.metrics);
        }
        setRepBreakdown(data?.repBreakdown || []);
      } catch (err) {
        if (!stale) {
          console.error('Failed to load DSR:', err);
          setLoadError(getErrorMessage(err) ?? "Couldn't load the report for this day. Check your connection and try again.");
        }
      } finally {
        if (!stale) setLoading(false);
      }
    };
    fetchDSR();
    return () => {
      stale = true;
    };
  }, [date, isManager, reloadKey]);

  const productivity = Math.round((metrics.productiveVisits / metrics.totalVisits) * 100 || 0);
  const dayLabel = date === today ? 'today' : `on ${formatDate(date)}`;

  return (
    <PageSection>
      <PageHeader
        title="Daily sales report"
        description="Visits, orders and collections for the selected day."
        breadcrumbs={[{ label: 'Reports', href: '/dashboard/reports' }, { label: 'DSR' }]}
        actions={
          <div className="flex w-full items-end gap-2 sm:w-auto">
            <Input
              type="date"
              label="Report date"
              hideLabel
              value={date}
              max={today}
              onChange={(e) => e.target.value && setDate(e.target.value)}
              containerClassName="flex-1 sm:w-44 sm:flex-none"
            />
            <Button variant="outline" leftIcon={<Printer />} onClick={() => window.print()} disabled={loading}>
              Print
            </Button>
          </div>
        }
      />

      {loadError ? (
        <ErrorState title="Couldn't load the DSR" message={loadError} onRetry={() => setReloadKey((k) => k + 1)} />
      ) : (
        <>
          <StatGrid columns={4}>
            <StatCard label={`Visits ${dayLabel}`} value={formatNumber(metrics.totalVisits)} icon={<MapPin />} tone="info" loading={loading} />
            <StatCard
              label="Productivity"
              value={`${productivity}%`}
              icon={<Target />}
              tone="success"
              hint={`${formatNumber(metrics.productiveVisits)} productive visits`}
              loading={loading}
            />
            <StatCard
              label="Order value"
              value={formatINR(metrics.totalOrderValue, { compact: true })}
              icon={<TrendingUp />}
              tone="primary"
              hint={`Across ${formatNumber(metrics.ordersCount)} orders`}
              loading={loading}
            />
            <StatCard
              label={`Collected ${dayLabel}`}
              value={formatINR(metrics.totalCollections, { compact: true })}
              icon={<IndianRupee />}
              tone="accent"
              loading={loading}
            />
          </StatGrid>

          {isManager && (
            <section aria-labelledby="dsr-reps" className="space-y-3">
              <h2 id="dsr-reps" className="text-base font-semibold text-gray-900">Field rep performance</h2>
              <DataTable
                caption="Field rep performance"
                itemLabel="reps"
                data={repBreakdown as RepRow[]}
                columns={repColumns}
                getRowId={(r) => r.userId}
                loading={loading}
                initialSort={{ id: 'value', direction: 'desc' }}
                mobileLayout="cards"
                pagination={{ pageSize: 25 }}
                emptyState={
                  <EmptyState
                    size="compact"
                    icon={<Users />}
                    title={`No rep activity ${dayLabel}`}
                    description="Pick another date, or check back after your reps log visits."
                    action={date !== today ? <Button variant="outline" onClick={() => setDate(today)}>Go to today</Button> : undefined}
                  />
                }
              />
            </section>
          )}
        </>
      )}
    </PageSection>
  );
}
