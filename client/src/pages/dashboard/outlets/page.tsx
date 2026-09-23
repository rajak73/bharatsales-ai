import { useState, useEffect, useMemo } from 'react';
import {
  Alert,
  Badge,
  Button,
  ConfirmDialog,
  DataTable,
  DataTableColumn,
  DropdownMenu,
  EmptyState,
  IconButton,
  Input,
  Modal,
  PageHeader,
  PageSection,
  SearchInput,
  Select,
  StatCard,
  StatGrid,
  StatusPill,
  Toolbar,
  formatINR,
  formatNumber,
  useToast,
} from '@bharatsales/ui';
import { OutletsService, DistributorsService } from '@bharatsales/api-client';
import { Outlet, Distributor } from '@bharatsales/shared-types';
import {
  Plus,
  MapPin,
  Phone,
  MoreHorizontal,
  Store,
  Power,
  Trash2,
  Truck,
  IndianRupee,
  CheckCircle2,
  Link2Off,
} from 'lucide-react';
import { ErrorState, getErrorMessage } from '../../../components/common/ErrorState';

type NewOutletForm = {
  name: string;
  code: string;
  ownerName: string;
  category: string;
  tier: 'A' | 'B' | 'C' | 'D';
  mobile: string;
  address: string;
  state: string;
  pinCode: string;
  creditLimit: string;
  paymentTermsDays: string;
};

const EMPTY_OUTLET: NewOutletForm = {
  name: '', code: '', ownerName: '', category: 'Grocery', tier: 'B',
  mobile: '', address: '', state: '', pinCode: '', creditLimit: '10000', paymentTermsDays: '7',
};

const TIER_OPTIONS = [
  { value: 'A', label: 'Tier A' },
  { value: 'B', label: 'Tier B' },
  { value: 'C', label: 'Tier C' },
  { value: 'D', label: 'Tier D' },
];

const outletKey = (o: Outlet) => String(o.id || (o as unknown as { _id?: string })._id || '');

function validateOutlet(f: NewOutletForm): Partial<Record<keyof NewOutletForm, string>> {
  const errors: Partial<Record<keyof NewOutletForm, string>> = {};
  if (!f.name.trim()) errors.name = 'Enter the outlet name';
  if (!f.code.trim()) errors.code = 'Enter an outlet code';
  if (!f.ownerName.trim()) errors.ownerName = "Enter the owner's name";
  if (!f.mobile.trim()) errors.mobile = 'Enter a mobile number';
  else if (!/^\+?\d[\d\s-]{8,14}$/.test(f.mobile.trim())) errors.mobile = 'Enter a valid 10-digit mobile number';
  if (f.pinCode && !/^\d{6}$/.test(f.pinCode.trim())) errors.pinCode = 'PIN code has 6 digits';
  return errors;
}

export default function OutletsPage() {
  const toast = useToast();
  const [loadError, setLoadError] = useState<string | null>(null);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [tierFilter, setTierFilter] = useState('');

  // Assignment Modal State
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedOutlet, setSelectedOutlet] = useState<Outlet | null>(null);
  const [selectedDistributorId, setSelectedDistributorId] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof NewOutletForm, string>>>({});
  const [confirmDeleteOutlet, setConfirmDeleteOutlet] = useState<Outlet | null>(null);
  const [newOutlet, setNewOutlet] = useState<NewOutletForm>(EMPTY_OUTLET);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const [outletsData, distData] = await Promise.all([
        OutletsService.getOutlets(),
        DistributorsService.getDistributors()
      ]);
      setOutlets(outletsData || []);
      setDistributors(distData || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setLoadError(getErrorMessage(error) ?? 'Failed to load outlets.');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignDistributor = async () => {
    if (!selectedOutlet || !selectedDistributorId) return;
    try {
      setIsAssigning(true);
      await OutletsService.updateOutlet(selectedOutlet.id, {
        commercial: {
          ...selectedOutlet.commercial,
          assignedDistributorId: selectedDistributorId
        }
      });
      // Update local state
      setOutlets(outlets.map(o => o.id === selectedOutlet.id ? {
        ...o,
        commercial: { ...o.commercial, assignedDistributorId: selectedDistributorId }
      } : o));
      toast.success(`Distributor assigned to ${selectedOutlet.name}`);
      setAssignModalOpen(false);
      setSelectedOutlet(null);
      setSelectedDistributorId('');
    } catch (error) {
      console.error('Failed to assign distributor', error);
      toast.error(getErrorMessage(error) ?? "Couldn't assign the distributor. Try again.");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleCreateOutlet = async () => {
    const errors = validateOutlet(newOutlet);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      const first = Object.keys(errors)[0];
      document.getElementById(`outlet-${first}`)?.focus();
      return;
    }
    if (!newOutlet.name || !newOutlet.code || !newOutlet.ownerName || !newOutlet.mobile) return;
    setCreating(true);
    setFormError('');
    try {
      await OutletsService.createOutlet({
        name: newOutlet.name,
        code: newOutlet.code,
        ownerName: newOutlet.ownerName,
        category: newOutlet.category,
        tier: newOutlet.tier,
        status: 'Active',
        mobile: newOutlet.mobile,
        location: {
          address: newOutlet.address,
          state: newOutlet.state,
          pinCode: newOutlet.pinCode,
          latitude: 0,
          longitude: 0,
          geofenceRadiusMeters: 100,
        },
        commercial: {
          creditLimit: Number(newOutlet.creditLimit) || 0,
          paymentTermsDays: Number(newOutlet.paymentTermsDays) || 0,
          outstandingBalance: 0,
        },
        tax: {},
      } as any);
      setShowAddModal(false);
      setNewOutlet(EMPTY_OUTLET);
      setFieldErrors({});
      toast.success(`Outlet "${newOutlet.name}" added`);
      await fetchData();
    } catch (error: any) {
      setFormError(error?.response?.data?.message || 'Failed to add outlet.');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleStatus = async (outlet: Outlet) => {
    const newStatus = outlet.status === 'Active' ? 'Inactive' : 'Active';
    try {
      await OutletsService.updateOutlet(outlet.id, { status: newStatus });
      setOutlets(outlets.map(o => o.id === outlet.id ? { ...o, status: newStatus } : o));
      toast.success(`${outlet.name} is now ${newStatus.toLowerCase()}`);
    } catch (error) {
      console.error('Failed to update outlet status', error);
      toast.error(getErrorMessage(error) ?? "Couldn't update the outlet status. Try again.");
    }
  };

  const handleDeleteOutlet = async (outlet: Outlet) => {
    try {
      await OutletsService.deleteOutlet(outlet.id);
      setOutlets(outlets.filter(o => o.id !== outlet.id));
      setConfirmDeleteOutlet(null);
      toast.success(`${outlet.name} deleted`);
    } catch (error) {
      console.error('Failed to delete outlet', error);
      toast.error(getErrorMessage(error) ?? "Couldn't delete the outlet. Try again.");
    }
  };

  const distributorName = (id?: string) =>
    id ? distributors.find(d => (d.id || (d as any)._id) === id)?.name || id : '';

  const openAssign = (outlet: Outlet) => {
    setSelectedOutlet(outlet);
    setSelectedDistributorId(outlet.commercial?.assignedDistributorId || '');
    setAssignModalOpen(true);
  };

  const openAdd = () => {
    setFormError('');
    setFieldErrors({});
    setShowAddModal(true);
  };

  const setField = <K extends keyof NewOutletForm>(key: K, value: NewOutletForm[K]) => {
    setNewOutlet(prev => ({ ...prev, [key]: value }));
    if (fieldErrors[key]) setFieldErrors(prev => ({ ...prev, [key]: undefined }));
  };

  // Search (name/owner) is applied by the table; status + tier filters here.
  const filteredOutlets = useMemo(
    () => outlets.filter(o =>
      (!statusFilter || o.status === statusFilter) && (!tierFilter || o.tier === tierFilter)),
    [outlets, statusFilter, tierFilter],
  );

  const stats = useMemo(() => {
    const active = outlets.filter(o => o.status === 'Active').length;
    const unassigned = outlets.filter(o => !o.commercial?.assignedDistributorId).length;
    const outstanding = outlets.reduce((s, o) => s + (Number(o.commercial?.outstandingBalance) || 0), 0);
    return { active, unassigned, outstanding };
  }, [outlets]);

  const columns: DataTableColumn<Outlet>[] = [
    {
      id: 'name',
      header: 'Outlet',
      accessor: (o) => `${o.name} ${o.ownerName ?? ''} ${o.code ?? ''}`,
      sortable: true,
      sortFn: (a, b) => a.name.localeCompare(b.name, 'en-IN'),
      primary: true,
      cell: (o) => (
        <div className="flex min-w-0 items-center gap-3">
          <span className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600 sm:flex" aria-hidden="true">
            <Store className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <div className="truncate font-medium text-gray-900">{o.name}</div>
            <div className="truncate text-xs text-foreground-subtle">
              {o.code || `ID ${outletKey(o).slice(-6).toUpperCase() || '------'}`}
              {o.tier ? ` · Tier ${o.tier}` : ''}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'contact',
      header: 'Owner & contact',
      accessor: (o) => `${o.ownerName ?? ''} ${o.mobile ?? ''}`,
      cell: (o) => (
        <div className="min-w-0">
          <div className="truncate text-gray-900">{o.ownerName || 'Owner not added'}</div>
          {o.mobile ? (
            <a href={`tel:${o.mobile}`} onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 text-xs text-foreground-subtle hover:text-primary-600">
              <Phone className="h-3 w-3" aria-hidden="true" />
              {o.mobile}
            </a>
          ) : (
            <span className="text-xs text-foreground-subtle">No mobile</span>
          )}
        </div>
      ),
    },
    {
      id: 'distributor',
      header: 'Distributor',
      accessor: (o) => distributorName(o.commercial?.assignedDistributorId),
      sortable: true,
      hideBelow: 'md',
      cell: (o) =>
        o.commercial?.assignedDistributorId ? (
          <span className="inline-flex max-w-[14rem] items-center gap-1.5 truncate text-gray-700">
            <Truck className="h-3.5 w-3.5 shrink-0 text-foreground-subtle" aria-hidden="true" />
            <span className="truncate">{distributorName(o.commercial.assignedDistributorId)}</span>
          </span>
        ) : (
          <Badge tone="warning" size="sm">Not assigned</Badge>
        ),
    },
    {
      id: 'location',
      header: 'Location',
      accessor: (o) => `${o.location?.address ?? ''} ${o.location?.state ?? ''} ${o.location?.pinCode ?? ''}`,
      hideBelow: 'lg',
      cell: (o) => {
        const place = [o.location?.state, o.location?.pinCode].filter(Boolean).join(' ');
        return (
          <div className="flex items-start gap-1 text-gray-700">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-foreground-subtle" aria-hidden="true" />
            <span className="tabular-nums">
              {place || `${o.location?.latitude?.toFixed(4) ?? '0.0000'}, ${o.location?.longitude?.toFixed(4) ?? '0.0000'}`}
            </span>
          </div>
        );
      },
    },
    {
      id: 'credit',
      header: 'Credit limit',
      accessor: (o) => Number(o.commercial?.creditLimit) || 0,
      sortable: true,
      align: 'right',
      hideBelow: 'lg',
      searchable: false,
      cell: (o) => <span className="tabular-nums">{formatINR(o.commercial?.creditLimit)}</span>,
    },
    {
      id: 'status',
      header: 'Status',
      accessor: 'status',
      sortable: true,
      searchable: false,
      cell: (o) => <StatusPill status={o.status} />,
    },
    {
      id: 'actions',
      header: <span className="sr-only">Actions</span>,
      align: 'right',
      hideInCard: false,
      width: 'w-12',
      cell: (o) => (
        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu
            trigger={(p) => <IconButton {...p} size="sm" aria-label={`Actions for ${o.name}`} icon={<MoreHorizontal />} />}
            items={[
              { label: o.commercial?.assignedDistributorId ? 'Change distributor' : 'Assign distributor', icon: <Truck className="h-4 w-4" />, onSelect: () => openAssign(o) },
              { label: o.status === 'Active' ? 'Deactivate' : 'Activate', icon: <Power className="h-4 w-4" />, onSelect: () => handleToggleStatus(o) },
              { type: 'separator' },
              { label: 'Delete outlet', icon: <Trash2 className="h-4 w-4" />, danger: true, onSelect: () => setConfirmDeleteOutlet(o) },
            ]}
          />
        </div>
      ),
    },
  ];

  const hasFilters = !!search || !!statusFilter || !!tierFilter;

  return (
    <PageSection>
      <PageHeader
        title="Outlets"
        description="Manage your retail store network across all territories."
        actions={<Button variant="accent" leftIcon={<Plus />} onClick={openAdd}>Add outlet</Button>}
      />

      <StatGrid columns={4}>
        <StatCard label="Total outlets" value={formatNumber(outlets.length)} icon={<Store />} loading={loading} />
        <StatCard label="Active" value={formatNumber(stats.active)} icon={<CheckCircle2 />} tone="success" loading={loading} />
        <StatCard
          label="No distributor"
          value={formatNumber(stats.unassigned)}
          icon={<Link2Off />}
          tone={stats.unassigned > 0 ? 'warning' : 'neutral'}
          hint={stats.unassigned > 0 ? 'Assign so orders can be fulfilled' : undefined}
          loading={loading}
        />
        <StatCard label="Outstanding" value={formatINR(stats.outstanding, { compact: true })} icon={<IndianRupee />} tone="info" loading={loading} />
      </StatGrid>

      <DataTable
        caption="Outlets"
        itemLabel="outlets"
        data={filteredOutlets}
        columns={columns}
        getRowId={(o, i) => outletKey(o) || String(i)}
        loading={loading}
        error={loadError && <ErrorState title="Couldn't load outlets" message={loadError} onRetry={fetchData} className="border-0" />}
        globalFilter={search}
        initialSort={{ id: 'name', direction: 'asc' }}
        mobileLayout="cards"
        emptyState={
          hasFilters ? undefined : (
            <EmptyState
              icon={<Store />}
              title="No outlets yet"
              description="Add your first outlet to start planning beats and taking orders."
              action={<Button leftIcon={<Plus />} onClick={openAdd}>Add outlet</Button>}
            />
          )
        }
        toolbar={
          <Toolbar>
            <SearchInput
              value={search}
              onValueChange={setSearch}
              placeholder="Search name, owner, code or mobile"
              aria-label="Search outlets"
              containerClassName="w-full sm:max-w-sm"
            />
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <Select
                hideLabel
                label="Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                placeholder="All statuses"
                options={[{ value: 'Active', label: 'Active' }, { value: 'Inactive', label: 'Inactive' }]}
              />
              <Select
                hideLabel
                label="Tier"
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value)}
                placeholder="All tiers"
                options={TIER_OPTIONS}
              />
            </div>
          </Toolbar>
        }
      />

      {/* Assign Distributor Modal */}
      <Modal
        open={assignModalOpen && !!selectedOutlet}
        onClose={() => setAssignModalOpen(false)}
        title="Assign distributor"
        description={selectedOutlet ? <>Choose who supplies <span className="font-medium text-gray-900">{selectedOutlet.name}</span>.</> : undefined}
        size="sm"
        dismissible={!isAssigning}
        footer={
          <>
            <Button variant="outline" onClick={() => setAssignModalOpen(false)} disabled={isAssigning}>Cancel</Button>
            <Button onClick={handleAssignDistributor} loading={isAssigning} disabled={!selectedDistributorId}>Assign distributor</Button>
          </>
        }
      >
        {distributors.filter(d => d.status === 'Active').length === 0 ? (
          <Alert tone="warning" title="No active distributors">Add or activate a distributor first, then assign it here.</Alert>
        ) : (
          <Select
            label="Distributor"
            required
            data-autofocus
            value={selectedDistributorId}
            onChange={(e) => setSelectedDistributorId(e.target.value)}
            placeholder="Select a distributor"
            options={distributors.filter(d => d.status === 'Active').map(d => ({ value: d.id, label: `${d.name} (${d.code})` }))}
          />
        )}
      </Modal>

      {/* Add Outlet Modal */}
      <Modal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add outlet"
        description="Outlets can be added to beats and receive orders once saved."
        size="lg"
        dismissible={!creating}
        footer={
          <>
            <Button variant="outline" onClick={() => setShowAddModal(false)} disabled={creating}>Cancel</Button>
            <Button type="submit" form="add-outlet-form" loading={creating}>Add outlet</Button>
          </>
        }
      >
        <form
          id="add-outlet-form"
          noValidate
          onSubmit={(e) => { e.preventDefault(); handleCreateOutlet(); }}
          className="space-y-4"
        >
          {formError && <Alert tone="danger" title="Couldn't add outlet" onDismiss={() => setFormError('')}>{formError}</Alert>}
          <div className="grid gap-3 sm:grid-cols-2">
            <Input id="outlet-name" data-autofocus label="Outlet name" required value={newOutlet.name} error={fieldErrors.name}
              onChange={(e) => setField('name', e.target.value)} />
            <Input id="outlet-code" label="Outlet code" required value={newOutlet.code} error={fieldErrors.code}
              onChange={(e) => setField('code', e.target.value)} helperText="Your internal store code" />
            <Input id="outlet-ownerName" label="Owner name" required value={newOutlet.ownerName} error={fieldErrors.ownerName}
              onChange={(e) => setField('ownerName', e.target.value)} autoComplete="name" />
            <Input id="outlet-mobile" label="Mobile" required type="tel" inputMode="tel" value={newOutlet.mobile} error={fieldErrors.mobile}
              onChange={(e) => setField('mobile', e.target.value)} placeholder="98765 43210" autoComplete="tel" />
            <Input id="outlet-category" label="Category" value={newOutlet.category}
              onChange={(e) => setField('category', e.target.value)} placeholder="Grocery, Chemist…" />
            <Select id="outlet-tier" label="Tier" value={newOutlet.tier} options={TIER_OPTIONS}
              onChange={(e) => setField('tier', e.target.value as NewOutletForm['tier'])} />
          </div>
          <Input id="outlet-address" label="Address" optional value={newOutlet.address}
            onChange={(e) => setField('address', e.target.value)} autoComplete="street-address" />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input id="outlet-state" label="State" optional value={newOutlet.state}
              onChange={(e) => setField('state', e.target.value)} />
            <Input id="outlet-pinCode" label="PIN code" optional inputMode="numeric" maxLength={6} value={newOutlet.pinCode} error={fieldErrors.pinCode}
              onChange={(e) => setField('pinCode', e.target.value)} autoComplete="postal-code" />
            <Input id="outlet-creditLimit" label="Credit limit" type="number" inputMode="decimal" min={0} leftIcon={<IndianRupee />}
              value={newOutlet.creditLimit} onChange={(e) => setField('creditLimit', e.target.value)} />
            <Input id="outlet-paymentTermsDays" label="Payment terms (days)" type="number" inputMode="numeric" min={0}
              value={newOutlet.paymentTermsDays} onChange={(e) => setField('paymentTermsDays', e.target.value)} />
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!confirmDeleteOutlet}
        onClose={() => setConfirmDeleteOutlet(null)}
        tone="danger"
        title="Delete this outlet?"
        description={<>This permanently deletes <span className="font-medium text-gray-900">{confirmDeleteOutlet?.name}</span>. This can't be undone.</>}
        confirmLabel="Delete outlet"
        onConfirm={() => confirmDeleteOutlet ? handleDeleteOutlet(confirmDeleteOutlet) : undefined}
      />
    </PageSection>
  );
}
