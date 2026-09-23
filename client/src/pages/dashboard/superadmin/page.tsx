import { useState, useEffect } from 'react';
import { SuperadminService } from '@bharatsales/api-client';
import { Building2, Building, Users, Database, Clock } from 'lucide-react';
import {
  Badge,
  Card,
  CardHeader,
  DataTable,
  EmptyState,
  PageHeader,
  PageSection,
  StatCard,
  StatGrid,
  StatusPill,
  formatDate,
  formatNumber,
} from '@bharatsales/ui';
import type { DataTableColumn } from '@bharatsales/ui';
import { ErrorState } from '../../../components/common/ErrorState';

interface SignupRow {
  _id: string;
  name: string;
  plan: string;
  status: string;
  createdAt: string;
}

const signupColumns: DataTableColumn<SignupRow>[] = [
  { id: 'name', header: 'Organization', accessor: 'name', sortable: true, primary: true, cell: (t) => <span className="font-medium text-gray-900">{t.name}</span> },
  { id: 'plan', header: 'Plan', accessor: 'plan', sortable: true, cell: (t) => <Badge tone="primary" size="sm">{t.plan}</Badge> },
  { id: 'status', header: 'Status', accessor: 'status', sortable: true, cell: (t) => <StatusPill status={t.status} size="sm" /> },
  { id: 'createdAt', header: 'Signed up', accessor: 'createdAt', sortable: true, cell: (t) => formatDate(t.createdAt) },
];

export default function PlatformDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError(null);
    SuperadminService.getPlatformDashboard()
      .then(setData)
      .catch((err) => {
        console.error('Failed to load platform dashboard:', err);
        setError(err?.response?.data?.message || err.message || 'Failed to load platform dashboard');
      })
      .finally(() => setLoading(false));
  }, [reloadKey]);

  const header = <PageHeader title="Platform dashboard" description="Cross-tenant overview of the BharatSales platform." />;

  if (error) {
    return (
      <PageSection>
        {header}
        <ErrorState title="Couldn't load the platform dashboard" message={error} onRetry={() => setReloadKey((k) => k + 1)} />
      </PageSection>
    );
  }

  const dbStatus: string = data?.database?.status ?? 'unknown';
  const dbHealthy = dbStatus === 'connected';

  return (
    <PageSection>
      {header}

      <StatGrid columns={4}>
        <StatCard label="Total organizations" value={formatNumber(data?.totalTenants ?? 0)} icon={<Building2 />} tone="primary" loading={loading} />
        <StatCard label="Active organizations" value={formatNumber(data?.activeTenants ?? 0)} icon={<Building />} tone="success" loading={loading} />
        <StatCard label="Total users" value={formatNumber(data?.totalUsers ?? 0)} icon={<Users />} tone="info" loading={loading} />
        <StatCard
          label="Database"
          value={<span className="capitalize">{dbStatus}</span>}
          icon={<Database />}
          tone={dbHealthy ? 'success' : 'danger'}
          hint={dbHealthy ? 'All systems normal' : 'Check the database connection'}
          loading={loading}
        />
      </StatGrid>

      <Card className="overflow-hidden">
        <CardHeader
          title={<span className="flex items-center gap-2"><Clock className="h-4 w-4 text-foreground-subtle" aria-hidden="true" />Recent signups</span>}
          description="Organizations that joined in the last 7 days"
          divided
        />
        <DataTable
          caption="Recent signups"
          itemLabel="organizations"
          data={(data?.recentSignups ?? []) as SignupRow[]}
          columns={signupColumns}
          getRowId={(t) => t._id}
          loading={loading}
          bordered={false}
          initialSort={{ id: 'createdAt', direction: 'desc' }}
          mobileLayout="cards"
          emptyState={
            <EmptyState size="compact" icon={<Building2 />} title="No new signups" description="No organizations signed up in the last 7 days." />
          }
        />
      </Card>
    </PageSection>
  );
}
