import { useState, useEffect, type ReactNode } from 'react';
import { AnalyticsService } from '@bharatsales/api-client';
import { ShoppingCart, Users, IndianRupee } from 'lucide-react';
import {
  Avatar,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  PageHeader,
  PageSection,
  StatCard,
  StatGrid,
  formatINR,
  formatNumber,
} from '@bharatsales/ui';
import { DistributorDashboard } from './_components/DistributorDashboard';
import { SuperAdminDashboard } from './_components/SuperAdminDashboard';
import { OrgAdminDashboard } from './_components/OrgAdminDashboard';
import { SalesManagerDashboard } from './_components/SalesManagerDashboard';
import { SalesRepDashboard } from './_components/SalesRepDashboard';
import { CardSkeleton, TrendBarChart, firstName, todayLabel } from './_components/widgets';
import { useCurrentUser } from '../../contexts/CurrentUserContext';
import { ErrorState, getErrorMessage } from '../../components/common/ErrorState';

const ROLE_SPECIFIC_ROLES = ['Distributor', 'Super Admin', 'Organization Admin', 'Sales Manager', 'Sales Representative'];

interface Kpi {
  label: string;
  value: string;
  change: number | null;
  icon: ReactNode;
}

export default function DashboardPage() {
  const user = useCurrentUser();
  const hasRoleDashboard = ROLE_SPECIFIC_ROLES.includes(user.role);
  const [dashboardData, setDashboardData] = useState<any>(null);
  // Role-specific dashboard components fetch their own data.
  const [loading, setLoading] = useState(!hasRoleDashboard);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasRoleDashboard) fetchDashboardData();
  }, [hasRoleDashboard]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const data = await AnalyticsService.getDashboardData();

      if (data && data.salesData && data.kpis) {
        // Transform the backend JSON object into the frontend array structure
        const k = data.kpis as any;
        data.kpis = [
          { label: 'Total revenue', value: formatINR(k.totalRevenue ?? 0, { compact: true }), change: Number(k.revenueGrowth ?? 0), icon: <IndianRupee /> },
          { label: 'Total orders', value: formatNumber(k.totalOrders ?? 0), change: Number(k.orderGrowth ?? 0), icon: <ShoppingCart /> },
          { label: 'Active users', value: formatNumber((k.activeReps || 0) + (k.activeOutlets || 0)), change: null, icon: <Users /> },
        ] satisfies Kpi[];

        data.teamActivity = (data.topSalesReps || []).map((rep: any) => ({
          name: rep.name || 'Unknown',
          location: rep.location || 'HQ',
          status: rep.status || 'Active Now',
        }));

        setDashboardData(data);
      } else {
        // Fallback to true empty state instead of mock data
        setDashboardData({
          kpis: [
            { label: 'Total revenue', value: formatINR(0), change: null, icon: <IndianRupee /> },
            { label: 'Total orders', value: '0', change: null, icon: <ShoppingCart /> },
            { label: 'Active users', value: '0', change: null, icon: <Users /> },
          ] satisfies Kpi[],
          salesData: [
            { day: 'Mon', orders: 0 },
            { day: 'Tue', orders: 0 },
            { day: 'Wed', orders: 0 },
            { day: 'Thu', orders: 0 },
            { day: 'Fri', orders: 0 },
            { day: 'Sat', orders: 0 },
            { day: 'Sun', orders: 0 },
          ],
          teamActivity: [],
        });
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setLoadError(getErrorMessage(error) ?? 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  if (user.role === 'Distributor') {
    return <DistributorDashboard userName={user.name} />;
  }
  if (user.role === 'Super Admin') {
    return <SuperAdminDashboard userName={user.name} />;
  }
  if (user.role === 'Organization Admin') {
    return <OrgAdminDashboard userName={user.name} />;
  }
  if (user.role === 'Sales Manager') {
    return <SalesManagerDashboard userName={user.name} />;
  }
  if (user.role === 'Sales Representative') {
    return <SalesRepDashboard userName={user.name} />;
  }

  const header = <PageHeader title={`Welcome back, ${firstName(user.name)}`} description={`${todayLabel()} · Your sales overview for today.`} />;

  if (loadError) {
    return (
      <PageSection>
        {header}
        <ErrorState title="Couldn't load your dashboard" message={loadError} onRetry={fetchDashboardData} />
      </PageSection>
    );
  }

  const kpis: Kpi[] = dashboardData?.kpis ?? [];
  const weekly = (dashboardData?.salesData ?? []).map((d: any) => ({ label: String(d.day), value: Number(d.orders) || 0 }));
  const team: { name: string; location: string; status: string }[] = dashboardData?.teamActivity ?? [];

  const presence = (status: string) => (status.includes('Active Now') ? 'online' : status.includes('Offline') ? 'offline' : 'away');
  const presenceLabel = (status: string) => (status === 'Active Now' ? 'Online' : status.includes('Offline') ? 'Offline' : 'Away');

  return (
    <PageSection>
      {header}

      <StatGrid columns={3}>
        {(loading ? [null, null, null] : kpis).map((kpi, idx) => (
          <StatCard
            key={idx}
            label={kpi?.label ?? 'Loading'}
            value={kpi?.value ?? '—'}
            icon={kpi?.icon}
            loading={loading}
            delta={kpi && kpi.change !== null ? { value: kpi.change, label: 'vs last period' } : undefined}
          />
        ))}
      </StatGrid>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Weekly sales overview" description="Total orders across all regions" divided />
          <CardBody>
            {loading ? (
              <CardSkeleton rows={4} label="Loading chart" />
            ) : (
              <TrendBarChart data={weekly} label="Orders per day this week" highlightMax />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Active team" divided />
          {loading ? (
            <CardSkeleton rows={4} label="Loading team" padded />
          ) : team.length === 0 ? (
            <EmptyState size="compact" icon={<Users />} title="No team activity yet" description="Reps show up here once they start their day." />
          ) : (
            <ul className="divide-y divide-border">
              {team.map((member, i) => (
                <li key={i} className="flex items-center gap-3 px-4 py-2.5">
                  <Avatar name={member.name} size="sm" status={presence(member.status || '')} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">{member.name || 'Unknown'}</p>
                    <p className="truncate text-xs text-foreground-subtle">{member.location || 'Unknown location'}</p>
                  </div>
                  <span className="text-xs font-medium text-foreground-muted">{presenceLabel(member.status || '')}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </PageSection>
  );
}
