import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { SuperadminService } from '@bharatsales/api-client';
import { Tenant } from '@bharatsales/shared-types';
import { Building2, IndianRupee, Plus, Receipt } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  DataTable,
  EmptyState,
  Input,
  LoadingRegion,
  Modal,
  PageHeader,
  PageSection,
  SearchInput,
  Skeleton,
  StatCard,
  StatGrid,
  StatusPill,
  Toolbar,
  formatDate,
  formatINR,
  formatNumber,
  useToast,
} from '@bharatsales/ui';
import type { DataTableColumn } from '@bharatsales/ui';
import { ErrorState, getErrorMessage } from '../../../../components/common/ErrorState';

type TenantRow = Tenant & { userCount: number };

const historyColumns: DataTableColumn<any>[] = [
  { id: 'date', header: 'Date', accessor: (r) => new Date(r.date).getTime() || 0, sortable: true, primary: true, cell: (r) => formatDate(r.date) },
  { id: 'plan', header: 'Plan', accessor: 'plan', sortable: true },
  { id: 'amount', header: 'Amount', accessor: (r) => Number(r.amount) || 0, sortable: true, align: 'right', cell: (r) => <span className="font-medium text-gray-900 tabular-nums">{formatINR(Number(r.amount))}</span> },
  { id: 'status', header: 'Status', accessor: 'status', align: 'right', cell: (r) => <StatusPill status={r.status} size="sm" /> },
];

export default function BillingPage() {
  const toast = useToast();
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [recordingFor, setRecordingFor] = useState<string | null>(null);
  const [form, setForm] = useState({ amount: '', plan: '' });
  const [amountError, setAmountError] = useState('');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setLoadError('');
      const [tenantData, metricsData] = await Promise.all([
        SuperadminService.getAllTenants(),
        SuperadminService.getMetrics(),
      ]);
      setTenants(tenantData);
      setMetrics(metricsData);
    } catch (error) {
      console.error('Failed to fetch billing data:', error);
      setLoadError(getErrorMessage(error) ?? "Couldn't load billing data. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const openRecordPayment = (tenant: Tenant) => {
    setAmountError('');
    setRecordingFor(tenant.id);
    setForm({ amount: '', plan: tenant.plan });
  };

  const handleRecordPayment = async () => {
    if (!recordingFor || !form.amount) return;
    try {
      setSaving(true);
      await SuperadminService.addBillingRecord(recordingFor, form);
      setRecordingFor(null);
      toast.success('Payment recorded');
      await fetchData();
    } catch (error) {
      console.error('Failed to record payment:', error);
      toast.error(getErrorMessage(error) ?? "Couldn't record the payment. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const n = Number(form.amount);
    if (!form.amount.trim() || !Number.isFinite(n) || n <= 0) {
      setAmountError('Enter the amount received, e.g. 24999');
      document.getElementById('payment-amount')?.focus();
      return;
    }
    handleRecordPayment();
  };

  const closeRecord = () => {
    if (!saving) setRecordingFor(null);
  };

  const recordingTenant = tenants.find((t) => t.id === recordingFor);
  const initialLoading = loading && tenants.length === 0;
  const q = search.toLowerCase();
  const visibleTenants = tenants.filter((t) => !q || t.name.toLowerCase().includes(q));
  const totalCollected = tenants.reduce(
    (sum, t) => sum + (t.billingHistory ?? []).reduce((s: number, r: any) => s + (Number(r.amount) || 0), 0),
    0,
  );

  if (loadError && tenants.length === 0) {
    return (
      <PageSection>
        <PageHeader title="Billing" description="Recurring revenue and per-organization billing history." />
        <ErrorState title="Couldn't load billing" message={loadError} onRetry={fetchData} />
      </PageSection>
    );
  }

  return (
    <PageSection>
      <PageHeader title="Billing" description="Recurring revenue and per-organization billing history." />

      <StatGrid columns={3}>
        <StatCard
          label="Monthly recurring revenue"
          value={formatINR(metrics?.mrr || 0, { compact: true })}
          icon={<IndianRupee />}
          tone="accent"
          hint="From active organizations’ current plans"
          loading={initialLoading}
        />
        <StatCard label="Payments recorded (all time)" value={formatINR(totalCollected, { compact: true })} icon={<Receipt />} tone="success" loading={initialLoading} />
        <StatCard label="Organizations" value={formatNumber(tenants.length)} icon={<Building2 />} tone="neutral" loading={initialLoading} />
      </StatGrid>

      <Toolbar>
        <SearchInput value={search} onValueChange={setSearch} placeholder="Search organizations…" aria-label="Search organizations" containerClassName="w-full sm:max-w-xs" />
      </Toolbar>

      {initialLoading ? (
        <LoadingRegion label="Loading billing" className="grid gap-4">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </LoadingRegion>
      ) : visibleTenants.length === 0 ? (
        <EmptyState
          bordered
          icon={<Building2 />}
          title={search ? 'No organizations match' : 'No organizations yet'}
          action={search ? <Button variant="outline" onClick={() => setSearch('')}>Clear search</Button> : undefined}
        />
      ) : (
        <ul className="grid gap-4">
          {visibleTenants.map((tenant) => {
            const history = tenant.billingHistory ?? [];
            return (
              <li key={tenant.id}>
                <Card className="overflow-hidden">
                  <CardHeader
                    title={<span className="flex flex-wrap items-center gap-2">{tenant.name}<Badge tone="primary" size="sm">{tenant.plan}</Badge></span>}
                    description={`${formatNumber(history.length)} payment${history.length === 1 ? '' : 's'} recorded`}
                    actions={
                      <Button size="sm" variant="outline" leftIcon={<Plus />} onClick={() => openRecordPayment(tenant)}>
                        Record payment
                      </Button>
                    }
                    divided
                  />
                  {history.length === 0 ? (
                    <p className="px-4 py-5 text-sm text-foreground-subtle">No billing history recorded yet.</p>
                  ) : (
                    <DataTable
                      caption={`Billing history for ${tenant.name}`}
                      itemLabel="payments"
                      data={history as any[]}
                      columns={historyColumns}
                      getRowId={(r, i) => r.id ?? String(i)}
                      bordered={false}
                      dense
                      initialSort={{ id: 'date', direction: 'desc' }}
                      pagination={history.length > 10 ? { pageSize: 10 } : false}
                    />
                  )}
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <Modal
        open={Boolean(recordingFor)}
        onClose={closeRecord}
        dismissible={!saving}
        size="sm"
        title="Record payment"
        description={recordingTenant?.name}
        footer={
          <>
            <Button variant="outline" onClick={closeRecord} disabled={saving}>Cancel</Button>
            <Button type="submit" form="record-payment-form" loading={saving}>Record payment</Button>
          </>
        }
      >
        <form id="record-payment-form" onSubmit={onSubmit} noValidate className="space-y-3">
          <Input
            id="payment-amount"
            data-autofocus
            label="Amount"
            required
            inputMode="decimal"
            leftIcon={<IndianRupee />}
            placeholder="24999"
            value={form.amount}
            onChange={(e) => {
              setForm({ ...form, amount: e.target.value });
              if (amountError) setAmountError('');
            }}
            error={amountError}
            helperText={!amountError && Number(form.amount) > 0 ? formatINR(Number(form.amount)) : undefined}
          />
          <Input label="Plan" value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })} />
        </form>
      </Modal>
    </PageSection>
  );
}
