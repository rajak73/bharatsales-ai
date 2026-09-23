import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Button,
  CheckList,
  DataTable,
  DataTableColumn,
  DropdownMenu,
  EmptyState,
  IconButton,
  Input,
  Modal,
  Drawer,
  PageHeader,
  PageSection,
  ProgressBar,
  SearchInput,
  Select,
  StatCard,
  StatGrid,
  StatusPill,
  Toolbar,
  cn,
  formatNumber,
  formatPercent,
  useToast,
} from '@bharatsales/ui';
import { DistributorsService, HierarchyService, ProductsService } from '@bharatsales/api-client';
import type { HierarchyNode, Product } from '@bharatsales/shared-types';
import { Plus, Users, UserCheck, Activity, Clock, MapPin, MoreHorizontal, Package, ShoppingCart, Truck } from 'lucide-react';
import { useCurrentUser } from '../../../contexts/CurrentUserContext';
import { ErrorState, getErrorMessage } from '../../../components/common/ErrorState';

type NewDistributorForm = {
  name: string; code: string; ownerName: string; mobile: string;
  address: string; city: string; state: string; pinCode: string;
};

const EMPTY_DISTRIBUTOR: NewDistributorForm = {
  name: '', code: '', ownerName: '', mobile: '',
  address: '', city: '', state: '', pinCode: '',
};

function validateDistributor(f: NewDistributorForm) {
  const errors: Partial<Record<keyof NewDistributorForm, string>> = {};
  if (!f.name.trim()) errors.name = 'Enter the distributor name';
  if (!f.code.trim()) errors.code = 'Enter a distributor code';
  if (!f.ownerName.trim()) errors.ownerName = "Enter the owner's name";
  if (!f.mobile.trim()) errors.mobile = 'Enter a mobile number';
  else if (!/^\+?\d[\d\s-]{8,14}$/.test(f.mobile.trim())) errors.mobile = 'Enter a valid 10-digit mobile number';
  if (f.pinCode && !/^\d{6}$/.test(f.pinCode.trim())) errors.pinCode = 'PIN code has 6 digits';
  return errors;
}

/** Small progress meter used for fill rate / fulfilment. */
function Meter({ value, label }: { value: number; label: string }) {
  const v = Math.max(0, Math.min(100, Number(value) || 0));
  const tone = v >= 90 ? 'success' : v >= 70 ? 'primary' : 'danger';
  return <ProgressBar value={v} label={label} tone={tone} size="xs" showValue className="min-w-[7rem]" />;
}

export default function DistributorsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [regionFilter, setRegionFilter] = useState('All Regions');
  const [showAddModal, setShowAddModal] = useState(false);
  const [allDistributors, setAllDistributors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { role } = useCurrentUser();

  const [newDistributor, setNewDistributor] = useState<NewDistributorForm>(EMPTY_DISTRIBUTOR);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof NewDistributorForm, string>>>({});
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Territory/product assignment — Organization Admin's job per BRD.
  const [assigningDist, setAssigningDist] = useState<any | null>(null);
  const [hierarchyNodes, setHierarchyNodes] = useState<HierarchyNode[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [assignForm, setAssignForm] = useState<{ territoryIds: string[]; productIds: string[] }>({ territoryIds: [], productIds: [] });
  const [savingAssignment, setSavingAssignment] = useState(false);
  const [assignError, setAssignError] = useState('');

  const fetchDistributors = async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      const data = await DistributorsService.getDistributors();

      if (data && data.length > 0) {
        // If we have real data, map it to match our UI requirements
        const mappedData = data.map((d: any) => ({
          id: d.id || d._id || d.code,
          name: d.name,
          location: { state: d.location?.state || d.territory || 'Unknown' },
          status: d.status || 'Active',
          inventoryHealth: d.fillRate || 0,
          orderFulfillment: d.orderFulfillment || 0,
          pendingOrders: d.pendingOrders || 0,
          territoryIds: d.territoryIds || [],
          productIds: d.productIds || [],
        }));
        setAllDistributors(mappedData);
      } else {
        setAllDistributors([]);
      }
    } catch (error) {
      console.error('Failed to fetch distributors', error);
      setLoadError(getErrorMessage(error) ?? 'Failed to load distributors.');
    } finally {
      setIsLoading(false);
    }
  };

  // Lookups for the Territory & products drawer (Organization Admin only —
  // Sales Managers have no Products:Read, so don't request it for them).
  const [lookupError, setLookupError] = useState('');
  const fetchLookups = () => {
    if (role !== 'Organization Admin') return;
    setLookupError('');
    Promise.allSettled([HierarchyService.getHierarchyNodes(), ProductsService.getProducts()]).then(([nodes, prods]) => {
      setHierarchyNodes(nodes.status === 'fulfilled' ? nodes.value || [] : []);
      setProducts(prods.status === 'fulfilled' ? prods.value || [] : []);
      const failed = [nodes, prods].find((r): r is PromiseRejectedResult => r.status === 'rejected');
      if (failed) setLookupError(getErrorMessage(failed.reason) ?? "Couldn't load territories and products.");
    });
  };

  useEffect(() => {
    fetchDistributors();
    fetchLookups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openAssignModal = (dist: any) => {
    setAssigningDist(dist);
    setAssignForm({ territoryIds: dist.territoryIds || [], productIds: dist.productIds || [] });
    setAssignError('');
  };

  const handleSaveAssignment = async () => {
    if (!assigningDist) return;
    setSavingAssignment(true);
    setAssignError('');
    try {
      await DistributorsService.updateDistributor(assigningDist.id, {
        territoryIds: assignForm.territoryIds,
        productIds: assignForm.productIds,
      } as any);
      toast.success(`Territory & products updated for "${assigningDist.name}"`);
      setAssigningDist(null);
      fetchDistributors();
    } catch (error: any) {
      setAssignError(error?.response?.data?.message || 'Failed to update assignment.');
    } finally {
      setSavingAssignment(false);
    }
  };

  // Search is handled by the table (name); status + region filters here.
  const filteredDistributors = allDistributors.filter(dist => {
    const territory = dist.location?.state || 'Unknown';
    const matchesStatus = statusFilter === 'All Status' || dist.status === statusFilter;
    const matchesRegion = regionFilter === 'All Regions' || territory.includes(regionFilter);
    return matchesStatus && matchesRegion;
  });

  const regionOptions = useMemo(() => {
    const set = new Set<string>();
    allDistributors.forEach(d => { if (d.location?.state && d.location.state !== 'Unknown') set.add(d.location.state); });
    return [{ value: 'All Regions', label: 'All regions' }, ...Array.from(set).sort().map(s => ({ value: s, label: s }))];
  }, [allDistributors]);

  const handleCreateDistributor = async () => {
    const errors = validateDistributor(newDistributor);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      document.getElementById(`dist-${Object.keys(errors)[0]}`)?.focus();
      return;
    }
    if (!newDistributor.name || !newDistributor.code || !newDistributor.ownerName || !newDistributor.mobile) return;
    setCreating(true);
    setCreateError('');
    try {
      await DistributorsService.createDistributor({
        name: newDistributor.name,
        code: newDistributor.code,
        ownerName: newDistributor.ownerName,
        mobile: newDistributor.mobile,
        status: 'Active',
        location: {
          address: newDistributor.address,
          city: newDistributor.city,
          state: newDistributor.state,
          pinCode: newDistributor.pinCode,
          latitude: 0,
          longitude: 0,
        },
      } as any);
      setShowAddModal(false);
      setNewDistributor(EMPTY_DISTRIBUTOR);
      setFieldErrors({});
      toast.success(`Distributor "${newDistributor.name}" added`);
      await fetchDistributors();
    } catch (error: any) {
      setCreateError(error?.response?.data?.message || 'Failed to add distributor.');
    } finally {
      setCreating(false);
    }
  };

  const openAdd = () => {
    setCreateError('');
    setFieldErrors({});
    setShowAddModal(true);
  };

  const setField = (key: keyof NewDistributorForm, value: string) => {
    setNewDistributor(prev => ({ ...prev, [key]: value }));
    if (fieldErrors[key]) setFieldErrors(prev => ({ ...prev, [key]: undefined }));
  };

  const isOrgAdmin = role === 'Organization Admin';
  const avgFill = allDistributors.length > 0 ? Math.round(allDistributors.reduce((acc, curr) => acc + curr.inventoryHealth, 0) / allDistributors.length) : 0;
  const totalPending = allDistributors.reduce((acc, curr) => acc + curr.pendingOrders, 0);
  const hasFilters = !!searchTerm || statusFilter !== 'All Status' || regionFilter !== 'All Regions';

  const columns: DataTableColumn<any>[] = [
    {
      id: 'name', header: 'Distributor', accessor: 'name', sortable: true, primary: true,
      cell: (d) => (
        <div className="min-w-0">
          <div className="truncate font-medium text-gray-900">{d.name}</div>
          <div className="flex items-center gap-1 text-xs text-foreground-subtle">
            <MapPin className="h-3 w-3" aria-hidden="true" />{d.location?.state}
          </div>
        </div>
      ),
    },
    { id: 'status', header: 'Status', accessor: 'status', sortable: true, searchable: false, cell: (d) => <StatusPill status={d.status} /> },
    { id: 'fill', header: 'Fill rate', accessor: 'inventoryHealth', sortable: true, searchable: false, hideBelow: 'md',
      cell: (d) => <Meter value={d.inventoryHealth} label={`Fill rate for ${d.name}`} /> },
    { id: 'fulfil', header: 'Fulfilment', accessor: 'orderFulfillment', sortable: true, searchable: false, hideBelow: 'lg',
      cell: (d) => <Meter value={d.orderFulfillment} label={`Order fulfilment for ${d.name}`} /> },
    { id: 'pending', header: 'Pending orders', accessor: 'pendingOrders', sortable: true, searchable: false, align: 'right',
      cell: (d) => <span className={cn('tabular-nums', d.pendingOrders > 0 ? 'font-semibold text-warning-700' : 'text-gray-700')}>{formatNumber(d.pendingOrders)}</span> },
    ...(isOrgAdmin ? [{
      id: 'coverage', header: 'Coverage', searchable: false, hideBelow: 'lg' as const,
      accessor: (d: any) => (d.territoryIds?.length || 0) + (d.productIds?.length || 0),
      cell: (d: any) => (
        <span className="text-sm text-gray-700 tabular-nums">
          {d.territoryIds?.length || 0} territories · {d.productIds?.length || 0} products
        </span>
      ),
    }] : []),
    {
      id: 'actions', header: <span className="sr-only">Actions</span>, align: 'right', width: 'w-12',
      cell: (d) => (
        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu
            trigger={(p) => <IconButton {...p} size="sm" aria-label={`Actions for ${d.name}`} icon={<MoreHorizontal />} />}
            items={[
              { label: 'View inventory', icon: <Package className="h-4 w-4" />, onSelect: () => navigate('/dashboard/inventory') },
              { label: 'Process orders', icon: <ShoppingCart className="h-4 w-4" />, onSelect: () => navigate('/dashboard/orders') },
              ...(isOrgAdmin ? [
                { type: 'separator' as const },
                { label: 'Territory & products', icon: <MapPin className="h-4 w-4" />, onSelect: () => openAssignModal(d) },
              ] : []),
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <PageSection>
      <PageHeader
        title="Distributor network"
        description="Track fill rates, fulfilment and pending orders across your distributors."
        actions={<Button variant="accent" leftIcon={<Plus />} onClick={openAdd}>Add distributor</Button>}
      />

      <StatGrid columns={4}>
        <StatCard label="Total distributors" value={formatNumber(allDistributors.length)} icon={<Users />} loading={isLoading} />
        <StatCard label="Active" value={formatNumber(allDistributors.filter(d => d.status === 'Active').length)} icon={<UserCheck />} tone="success" loading={isLoading} />
        <StatCard label="Avg fill rate" value={formatPercent(avgFill, { decimals: 0 })} icon={<Activity />} tone="info" loading={isLoading} />
        <StatCard label="Pending orders" value={formatNumber(totalPending)} icon={<Clock />} tone={totalPending > 0 ? 'warning' : 'neutral'} loading={isLoading}
          onClick={totalPending > 0 ? () => navigate('/dashboard/orders') : undefined} />
      </StatGrid>

      <DataTable
        caption="Distributors"
        itemLabel="distributors"
        data={filteredDistributors}
        columns={columns}
        loading={isLoading}
        error={loadError && <ErrorState title="Couldn't load distributors" message={loadError} onRetry={fetchDistributors} className="border-0" />}
        globalFilter={searchTerm}
        initialSort={{ id: 'name', direction: 'asc' }}
        mobileLayout="cards"
        emptyState={
          hasFilters ? (
            <EmptyState size="compact" title="No distributors match" description="Try adjusting your filters or search term."
              action={<Button variant="outline" onClick={() => { setSearchTerm(''); setStatusFilter('All Status'); setRegionFilter('All Regions'); }}>Clear filters</Button>} />
          ) : (
            <EmptyState icon={<Truck />} title="No distributors yet" description="Add a distributor so outlets can be supplied and orders fulfilled."
              action={<Button leftIcon={<Plus />} onClick={openAdd}>Add distributor</Button>} />
          )
        }
        toolbar={
          <Toolbar>
            <SearchInput value={searchTerm} onValueChange={setSearchTerm} placeholder="Search distributors by name" aria-label="Search distributors" containerClassName="w-full sm:max-w-sm" />
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <Select hideLabel label="Region" value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)} options={regionOptions} />
              <Select hideLabel label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: 'All Status', label: 'All statuses' },
                  { value: 'Active', label: 'Active' },
                  { value: 'Review', label: 'Review' },
                  { value: 'Inactive', label: 'Inactive' },
                ]} />
            </div>
          </Toolbar>
        }
      />

      {/* Add Distributor */}
      <Modal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add distributor"
        description="Once added, you can assign outlets, territories and products."
        size="lg"
        dismissible={!creating}
        footer={
          <>
            <Button variant="outline" onClick={() => setShowAddModal(false)} disabled={creating}>Cancel</Button>
            <Button type="submit" form="add-distributor-form" loading={creating}>Add distributor</Button>
          </>
        }
      >
        <form id="add-distributor-form" noValidate onSubmit={(e) => { e.preventDefault(); handleCreateDistributor(); }} className="space-y-4">
          {createError && <Alert tone="danger" title="Couldn't add distributor" onDismiss={() => setCreateError('')}>{createError}</Alert>}
          <div className="grid gap-3 sm:grid-cols-2">
            <Input id="dist-name" data-autofocus label="Distributor name" required value={newDistributor.name} error={fieldErrors.name} onChange={(e) => setField('name', e.target.value)} />
            <Input id="dist-code" label="Distributor code" required value={newDistributor.code} error={fieldErrors.code} onChange={(e) => setField('code', e.target.value)} />
            <Input id="dist-ownerName" label="Owner name" required value={newDistributor.ownerName} error={fieldErrors.ownerName} onChange={(e) => setField('ownerName', e.target.value)} autoComplete="name" />
            <Input id="dist-mobile" label="Mobile" required type="tel" inputMode="tel" value={newDistributor.mobile} error={fieldErrors.mobile} onChange={(e) => setField('mobile', e.target.value)} placeholder="98765 43210" autoComplete="tel" />
          </div>
          <Input id="dist-address" label="Address" optional value={newDistributor.address} onChange={(e) => setField('address', e.target.value)} autoComplete="street-address" />
          <div className="grid gap-3 sm:grid-cols-3">
            <Input id="dist-city" label="City" optional value={newDistributor.city} onChange={(e) => setField('city', e.target.value)} />
            <Input id="dist-state" label="State" optional value={newDistributor.state} onChange={(e) => setField('state', e.target.value)} />
            <Input id="dist-pinCode" label="PIN code" optional inputMode="numeric" maxLength={6} value={newDistributor.pinCode} error={fieldErrors.pinCode} onChange={(e) => setField('pinCode', e.target.value)} autoComplete="postal-code" />
          </div>
        </form>
      </Modal>

      {/* Territory & Product Assignment (Organization Admin only) */}
      <Drawer
        open={!!assigningDist}
        onClose={() => setAssigningDist(null)}
        title="Territory & products"
        description={assigningDist?.name}
        size="md"
        dismissible={!savingAssignment}
        footer={
          <>
            <Button variant="outline" onClick={() => setAssigningDist(null)} disabled={savingAssignment}>Cancel</Button>
            <Button onClick={handleSaveAssignment} loading={savingAssignment}>Save assignment</Button>
          </>
        }
      >
        <div className="space-y-4">
          {assignError && <Alert tone="danger" onDismiss={() => setAssignError('')}>{assignError}</Alert>}
          {lookupError && (
            <Alert tone="danger" title="Territories and products didn't load" actions={<Button size="sm" variant="outline" onClick={fetchLookups}>Try again</Button>}>
              {lookupError}
            </Alert>
          )}
          <CheckList
            label="Territories"
            emptyText="No territories yet. Set up your sales hierarchy first."
            items={hierarchyNodes.map(n => ({ id: n.id, label: `${n.level}: ${n.name}` }))}
            selected={assignForm.territoryIds}
            onToggle={(id, checked) => setAssignForm(prev => ({
              ...prev,
              territoryIds: checked ? [...prev.territoryIds, id] : prev.territoryIds.filter(x => x !== id),
            }))}
          />
          <CheckList
            label="Products"
            emptyText="No products yet. Add products to your catalogue first."
            items={products.map(p => ({ id: p.id, label: p.name }))}
            selected={assignForm.productIds}
            onToggle={(id, checked) => setAssignForm(prev => ({
              ...prev,
              productIds: checked ? [...prev.productIds, id] : prev.productIds.filter(x => x !== id),
            }))}
          />
        </div>
      </Drawer>
    </PageSection>
  );
}
