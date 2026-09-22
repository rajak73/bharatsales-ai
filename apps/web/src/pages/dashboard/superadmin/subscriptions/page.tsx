import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { SuperadminService } from '@bharatsales/api-client';
import { Tenant } from '@bharatsales/shared-types';
import { CreditCard, Pencil } from 'lucide-react';
import {
  Badge,
  Button,
  DataTable,
  EmptyState,
  Input,
  Modal,
  PageHeader,
  PageSection,
  ProgressBar,
  SearchInput,
  Select,
  Toolbar,
  cn,
  formatNumber,
  useToast,
} from '@bharatsales/ui';
import type { DataTableColumn } from '@bharatsales/ui';
import { ErrorState, getErrorMessage } from '../../../../components/common/ErrorState';

type TenantRow = Tenant & { userCount: number };

const usersLimit = (t: TenantRow) => t.subscriptionUsersLimit || 10;

export default function SubscriptionsPage() {
  const toast = useToast();
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ plan: '', billingCycle: '', subscriptionUsersLimit: 0 });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      setLoadError('');
      const data = await SuperadminService.getAllTenants();
      setTenants(data);
    } catch (error) {
      console.error('Failed to fetch tenants:', error);
      setLoadError(getErrorMessage(error) ?? "Couldn't load subscriptions. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (tenant: TenantRow) => {
    setEditing(tenant.id);
    setForm({
      plan: tenant.plan,
      billingCycle: tenant.billingCycle || 'Annual',
      subscriptionUsersLimit: tenant.subscriptionUsersLimit || 10
    });
  };

  const handleSave = async (id: string) => {
    try {
      setSaving(true);
      await SuperadminService.updateSubscription(id, form);
      setEditing(null);
      toast.success('Subscription updated');
      await fetchTenants();
    } catch (error) {
      console.error('Failed to update subscription:', error);
      toast.error(getErrorMessage(error) ?? "Couldn't update the subscription. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const editingTenant = tenants.find((t) => t.id === editing);
  const closeEdit = () => {
    if (!saving) setEditing(null);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (editing) handleSave(editing);
  };

  const columns: DataTableColumn<TenantRow>[] = [
    { id: 'name', header: 'Organization', accessor: 'name', sortable: true, primary: true, cell: (t) => <span className="font-medium text-gray-900">{t.name}</span> },
    { id: 'plan', header: 'Plan', accessor: 'plan', sortable: true, cell: (t) => <Badge tone="primary" size="sm">{t.plan}</Badge> },
    { id: 'billing', header: 'Billing', accessor: (t) => t.billingCycle || 'Annual', sortable: true, hideBelow: 'md' },
    {
      id: 'usage',
      header: 'Users',
      accessor: (t) => t.userCount / usersLimit(t),
      sortable: true,
      cell: (t) => {
        const limit = usersLimit(t);
        const pct = Math.min(100, (t.userCount / limit) * 100);
        const over = t.userCount > limit;
        return (
          <div className="min-w-[8rem]">
            <div className="flex items-center justify-between gap-2 text-sm tabular-nums">
              <span className={cn(over ? 'font-medium text-danger-700' : 'text-gray-700')}>
                {formatNumber(t.userCount)} / {formatNumber(limit)}
              </span>
              {over && <Badge tone="danger" size="sm">Over limit</Badge>}
            </div>
            <ProgressBar value={pct} decorative size="xs" tone={over ? 'danger' : pct >= 80 ? 'warning' : 'primary'} className="mt-1.5" />
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: <span className="sr-only">Actions</span>,
      align: 'right',
      cell: (t) => (
        <Button size="sm" variant="outline" leftIcon={<Pencil />} onClick={() => startEdit(t)} aria-label={`Edit plan for ${t.name}`}>
          Edit plan
        </Button>
      ),
    },
  ];

  return (
    <PageSection>
      <PageHeader title="Subscriptions" description="Adjust each organization’s plan, billing cycle and user limit." />

      <DataTable
        caption="Subscriptions"
        itemLabel="organizations"
        data={tenants}
        columns={columns}
        getRowId={(t) => t.id}
        loading={loading && tenants.length === 0}
        error={loadError && <ErrorState title="Couldn't load subscriptions" message={loadError} onRetry={fetchTenants} className="border-0" />}
        globalFilter={search}
        initialSort={{ id: 'name', direction: 'asc' }}
        mobileLayout="cards"
        toolbar={
          <Toolbar>
            <SearchInput value={search} onValueChange={setSearch} placeholder="Search organizations…" aria-label="Search organizations" containerClassName="w-full sm:max-w-xs" />
          </Toolbar>
        }
        emptyState={<EmptyState size="compact" icon={<CreditCard />} title="No organizations yet" description="Subscriptions appear here once organizations are created." />}
      />

      <Modal
        open={Boolean(editing)}
        onClose={closeEdit}
        dismissible={!saving}
        title="Edit plan"
        description={editingTenant ? `${editingTenant.name} · ${formatNumber(editingTenant.userCount)} users today` : undefined}
        footer={
          <>
            <Button variant="outline" onClick={closeEdit} disabled={saving}>Cancel</Button>
            <Button type="submit" form="subscription-form" loading={saving}>Save plan</Button>
          </>
        }
      >
        <form id="subscription-form" onSubmit={onSubmit} noValidate className="grid gap-3 sm:grid-cols-2">
          <Select
            data-autofocus
            label="Plan"
            value={form.plan}
            onChange={(e) => setForm({ ...form, plan: e.target.value })}
            options={['Starter', 'Growth', 'Enterprise'].map((p) => ({ value: p, label: p }))}
          />
          <Select
            label="Billing cycle"
            value={form.billingCycle}
            onChange={(e) => setForm({ ...form, billingCycle: e.target.value })}
            options={['Monthly', 'Annual'].map((p) => ({ value: p, label: p }))}
          />
          <Input
            label="User limit"
            type="number"
            inputMode="numeric"
            min={1}
            value={form.subscriptionUsersLimit}
            onChange={(e) => setForm({ ...form, subscriptionUsersLimit: Number(e.target.value) })}
            containerClassName="sm:col-span-2"
            error={
              editingTenant && form.subscriptionUsersLimit < editingTenant.userCount
                ? `Lower than the ${formatNumber(editingTenant.userCount)} users this organization already has`
                : undefined
            }
          />
        </form>
      </Modal>
    </PageSection>
  );
}
