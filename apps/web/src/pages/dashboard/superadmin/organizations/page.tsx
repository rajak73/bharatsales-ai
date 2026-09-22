import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { SuperadminService } from '@bharatsales/api-client';
import { Tenant } from '@bharatsales/shared-types';
import {
  Alert,
  Badge,
  Button,
  ConfirmDialog,
  DataTable,
  EmptyState,
  Input,
  Modal,
  PageHeader,
  PageSection,
  SearchInput,
  Select,
  StatusPill,
  Toolbar,
  formatDate,
  formatNumber,
  useToast,
} from '@bharatsales/ui';
import type { DataTableColumn } from '@bharatsales/ui';
import { Building2, CheckCircle2, PauseCircle, Plus, PlayCircle } from 'lucide-react';
import { ErrorState, getErrorMessage } from '../../../../components/common/ErrorState';

type TenantRow = Tenant & { userCount: number };
type NewTenantErrors = Partial<Record<'name' | 'adminName' | 'adminEmail' | 'adminPassword', string>>;

const EMPTY_TENANT = { name: '', plan: 'Starter', adminName: '', adminEmail: '', adminPassword: '' };
const ALL = 'all';

export default function OrganizationsPage() {
  const toast = useToast();
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTenant, setNewTenant] = useState(EMPTY_TENANT);
  const [formErrors, setFormErrors] = useState<NewTenantErrors>({});
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);
  const [confirmSuspend, setConfirmSuspend] = useState<TenantRow | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(ALL);

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
      setLoadError(getErrorMessage(error) ?? "Couldn't load organizations. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      setActionLoading(id);
      await SuperadminService.updateTenantStatus(id, status);
      await fetchTenants();
      toast.success(status === 'Suspended' ? 'Organization suspended' : 'Organization activated');
    } catch (error) {
      console.error('Failed to update tenant status:', error);
      toast.error(getErrorMessage(error) ?? "Couldn't update the organization. Try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateTenant = async () => {
    if (!newTenant.name || !newTenant.adminName || !newTenant.adminEmail || !newTenant.adminPassword) return;
    try {
      setCreating(true);
      setCreateError('');
      await SuperadminService.createTenant(newTenant as any);
      setShowCreateModal(false);
      toast.success(`${newTenant.name} created`);
      setNewTenant(EMPTY_TENANT);
      await fetchTenants();
    } catch (error) {
      console.error('Failed to create tenant:', error);
      setCreateError(getErrorMessage(error) ?? "Couldn't create the organization. Try again.");
    } finally {
      setCreating(false);
    }
  };

  const openCreate = () => {
    setFormErrors({});
    setCreateError('');
    setShowCreateModal(true);
  };

  const closeCreate = () => {
    if (creating) return;
    setShowCreateModal(false);
  };

  const onSubmitCreate = (e: FormEvent) => {
    e.preventDefault();
    const errors: NewTenantErrors = {};
    if (!newTenant.name.trim()) errors.name = 'Enter the organization name';
    if (!newTenant.adminName.trim()) errors.adminName = 'Enter the admin’s name';
    if (!newTenant.adminEmail.trim()) errors.adminEmail = 'Enter the admin’s email';
    else if (!/^\S+@\S+\.\S+$/.test(newTenant.adminEmail.trim())) errors.adminEmail = 'Enter a valid email address';
    if (!newTenant.adminPassword) errors.adminPassword = 'Set a temporary password';
    setFormErrors(errors);
    const first = (['name', 'adminName', 'adminEmail', 'adminPassword'] as const).find((k) => errors[k]);
    if (first) {
      document.getElementById(`tenant-${first}`)?.focus();
      return;
    }
    handleCreateTenant();
  };

  const setField = (key: keyof typeof EMPTY_TENANT, value: string) => {
    setNewTenant((t) => ({ ...t, [key]: value }));
    if (key in formErrors) setFormErrors((er) => ({ ...er, [key]: undefined }));
  };

  const statuses = Array.from(new Set(tenants.map((t) => t.status))).sort();
  const filtered = statusFilter === ALL ? tenants : tenants.filter((t) => t.status === statusFilter);
  const pendingCount = tenants.filter((t) => t.status === 'Pending Approval').length;

  const columns: DataTableColumn<TenantRow>[] = [
    { id: 'name', header: 'Organization', accessor: 'name', sortable: true, primary: true, cell: (t) => <span className="font-medium text-gray-900">{t.name}</span> },
    { id: 'status', header: 'Status', accessor: 'status', sortable: true, cell: (t) => <StatusPill status={t.status} size="sm" /> },
    { id: 'plan', header: 'Plan', accessor: 'plan', sortable: true, hideBelow: 'md', cell: (t) => <Badge tone="primary" size="sm">{t.plan}</Badge> },
    { id: 'users', header: 'Users', accessor: 'userCount', sortable: true, align: 'right', hideBelow: 'sm', cell: (t) => formatNumber(t.userCount) },
    { id: 'createdAt', header: 'Registered', accessor: 'createdAt', sortable: true, hideBelow: 'lg', cell: (t) => formatDate(t.createdAt) },
    {
      id: 'actions',
      header: <span className="sr-only">Actions</span>,
      align: 'right',
      hideInCard: false,
      cell: (t) => {
        const busy = actionLoading === t.id;
        return (
          <div className="flex flex-wrap justify-end gap-2">
            {t.status === 'Pending Approval' && (
              <Button size="sm" leftIcon={<CheckCircle2 />} loading={busy} onClick={() => updateStatus(t.id, 'Active')}>
                Approve
              </Button>
            )}
            {t.status !== 'Active' && t.status !== 'Pending Approval' && (
              <Button size="sm" variant="outline" leftIcon={<PlayCircle />} loading={busy} onClick={() => updateStatus(t.id, 'Active')}>
                Activate
              </Button>
            )}
            {t.status !== 'Suspended' && (
              <Button
                size="sm"
                variant="ghost"
                className="text-danger-600 hover:bg-danger-50 hover:text-danger-700"
                leftIcon={<PauseCircle />}
                disabled={busy}
                onClick={() => setConfirmSuspend(t)}
              >
                Suspend
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <PageSection>
      <PageHeader
        title="Organizations"
        description="Manage every tenant organization on the platform."
        titleAddon={pendingCount > 0 ? <Badge tone="warning" size="sm">{pendingCount} pending approval</Badge> : undefined}
        actions={<Button variant="accent" leftIcon={<Plus />} onClick={openCreate}>Create organization</Button>}
      />

      <DataTable
        caption="Organizations"
        itemLabel="organizations"
        data={filtered}
        columns={columns}
        getRowId={(t) => t.id}
        loading={loading && tenants.length === 0}
        error={loadError && <ErrorState title="Couldn't load organizations" message={loadError} onRetry={fetchTenants} className="border-0" />}
        globalFilter={search}
        initialSort={{ id: 'createdAt', direction: 'desc' }}
        mobileLayout="cards"
        toolbar={
          <Toolbar>
            <SearchInput value={search} onValueChange={setSearch} placeholder="Search organizations…" aria-label="Search organizations" containerClassName="w-full sm:max-w-xs" />
            <Select
              hideLabel
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[{ value: ALL, label: 'All statuses' }, ...statuses.map((s) => ({ value: s, label: s }))]}
              containerClassName="w-full sm:w-48"
            />
          </Toolbar>
        }
        emptyState={
          <EmptyState
            size="compact"
            icon={<Building2 />}
            title="No organizations yet"
            description="Create the first organization and its admin account."
            action={<Button leftIcon={<Plus />} onClick={openCreate}>Create organization</Button>}
          />
        }
      />

      <Modal
        open={showCreateModal}
        onClose={closeCreate}
        dismissible={!creating}
        title="Create organization"
        description="Sets up the tenant and its first Organization Admin account."
        footer={
          <>
            <Button variant="outline" onClick={closeCreate} disabled={creating}>Cancel</Button>
            <Button type="submit" form="create-tenant-form" loading={creating}>Create organization</Button>
          </>
        }
      >
        <form id="create-tenant-form" onSubmit={onSubmitCreate} noValidate className="space-y-3">
          {createError && <Alert tone="danger" onDismiss={() => setCreateError('')}>{createError}</Alert>}
          <div className="grid gap-3 sm:grid-cols-3">
            <Input
              id="tenant-name"
              data-autofocus
              label="Organization name"
              required
              value={newTenant.name}
              onChange={(e) => setField('name', e.target.value)}
              error={formErrors.name}
              containerClassName="sm:col-span-2"
            />
            <Select
              label="Plan"
              value={newTenant.plan}
              onChange={(e) => setField('plan', e.target.value)}
              options={['Starter', 'Growth', 'Enterprise'].map((p) => ({ value: p, label: p }))}
            />
          </div>
          <fieldset className="space-y-4 border-t border-border pt-4">
            <legend className="pr-2 text-xs font-semibold uppercase tracking-wide text-foreground-subtle">Organization admin</legend>
            <Input id="tenant-adminName" label="Admin name" required autoComplete="off" value={newTenant.adminName} onChange={(e) => setField('adminName', e.target.value)} error={formErrors.adminName} />
            <Input id="tenant-adminEmail" label="Admin email" type="email" required autoComplete="off" value={newTenant.adminEmail} onChange={(e) => setField('adminEmail', e.target.value)} error={formErrors.adminEmail} />
            <Input
              id="tenant-adminPassword"
              label="Temporary password"
              type="password"
              required
              autoComplete="new-password"
              value={newTenant.adminPassword}
              onChange={(e) => setField('adminPassword', e.target.value)}
              error={formErrors.adminPassword}
              helperText="Share it securely; the admin should change it after first login."
            />
          </fieldset>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmSuspend)}
        onClose={() => setConfirmSuspend(null)}
        tone="danger"
        title={`Suspend ${confirmSuspend?.name ?? 'organization'}?`}
        description="Its users will lose access until you activate it again."
        confirmLabel="Suspend organization"
        cancelLabel="Keep active"
        onConfirm={async () => {
          if (confirmSuspend) await updateStatus(confirmSuspend.id, 'Suspended');
          setConfirmSuspend(null);
        }}
      />
    </PageSection>
  );
}
