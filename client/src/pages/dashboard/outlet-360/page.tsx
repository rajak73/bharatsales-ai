import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  CardHeader,
  CardBody,
  DataTable,
  DataTableColumn,
  EmptyState,
  Input,
  LoadingRegion,
  Modal,
  PageHeader,
  PageSection,
  Skeleton,
  StatCard,
  StatGrid,
  StatusPill,
  TabPanel,
  Tabs,
  formatDate,
  formatINR,
  formatNumber,
  useToast,
} from '@bharatsales/ui';
import { Outlet360Service, OutletsService } from '@bharatsales/api-client';
import { Outlet360Details, Outlet360Order, Outlet360Visit } from '@bharatsales/shared-types';
import { Check, Pencil, ShoppingCart, IndianRupee, TrendingUp, Wallet, Store, ClipboardList, MapPinned, Phone } from 'lucide-react';
import { ErrorState, getErrorMessage } from '../../../components/common/ErrorState';

/** Dates from the API may already be display strings; format them when parseable. */
const showDate = (d: string) => formatDate(d, 'medium', d || '—');

function DetailList({ items }: { items: { label: string; value: React.ReactNode }[] }) {
  return (
    <dl className="grid gap-x-4 gap-y-3 sm:grid-cols-2">
      {items.map((it) => (
        <div key={it.label} className="min-w-0">
          <dt className="text-xs font-medium text-foreground-subtle">{it.label}</dt>
          <dd className="mt-0.5 break-words text-sm font-medium text-gray-900">{it.value || '—'}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function Outlet360Page() {
  const toast = useToast();
  const [activeSection, setActiveSection] = useState('identity');
  const [errorMessage, setErrorMessage] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);

  const [outlet, setOutlet] = useState<Outlet360Details | null>(null);
  const [orderHistory, setOrderHistory] = useState<Outlet360Order[]>([]);
  const [visitHistory, setVisitHistory] = useState<Outlet360Visit[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', ownerName: '', category: '' });
  const [nameError, setNameError] = useState('');
  const [saving, setSaving] = useState(false);

  const [searchParams] = useSearchParams();
  const requestedId = searchParams.get('id');

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setLoadError(null);

      let outletId = requestedId;

      if (!outletId) {
        // Fallback: fetch all outlets and pick the first one
        const allOutlets = await OutletsService.getOutlets();
        const first = allOutlets?.[0] as ({ id?: string; _id?: string } | undefined);
        outletId = first?.id || first?._id || null;
      }

      if (!outletId) {
        setOutlet(null);
        setLoading(false);
        return; // outlet will remain null -> "Outlet not found"
      }

      const data = await Outlet360Service.getOutlet360(outletId);

      setOutlet(data.outlet);
      setOrderHistory(data.recentOrders || []);
      setVisitHistory(data.recentVisits || []);
      setAnalytics(data.analytics);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setLoadError(getErrorMessage(error) ?? "We couldn't load this outlet. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const startEditing = () => {
    if (!outlet) return;
    setEditForm({ name: outlet.name, ownerName: outlet.owner, category: outlet.category });
    setNameError('');
    setErrorMessage('');
    setIsEditing(true);
    setActiveSection('identity');
  };

  const handleSave = async () => {
    if (!outlet) return;
    if (!editForm.name.trim()) {
      setNameError('Enter the outlet name');
      document.getElementById('edit-outlet-name')?.focus();
      return;
    }
    setSaving(true);
    setErrorMessage('');
    try {
      await OutletsService.updateOutlet(outlet.id, {
        name: editForm.name,
        ownerName: editForm.ownerName,
        category: editForm.category,
      });
      setOutlet({ ...outlet, name: editForm.name, owner: editForm.ownerName, category: editForm.category });
      setIsEditing(false);
      toast.success('Outlet details updated');
    } catch (error) {
      console.error('Failed to update outlet', error);
      setErrorMessage('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const orderColumns: DataTableColumn<Outlet360Order>[] = [
    { id: 'order', header: 'Order', accessor: 'orderNumber', sortable: true, primary: true,
      cell: (o) => <span className="font-medium text-gray-900">{o.orderNumber}</span> },
    { id: 'date', header: 'Date', accessor: 'date', sortable: true, cell: (o) => showDate(o.date) },
    { id: 'items', header: 'Items', accessor: 'items', align: 'right', hideBelow: 'sm', cell: (o) => <span className="tabular-nums">{formatNumber(o.items)}</span> },
    { id: 'amount', header: 'Amount', accessor: 'amount', sortable: true, align: 'right',
      cell: (o) => <span className="font-medium tabular-nums">{formatINR(o.amount)}</span> },
    { id: 'status', header: 'Status', accessor: 'status', cell: (o) => <StatusPill status={o.status} /> },
  ];

  const visitColumns: DataTableColumn<Outlet360Visit>[] = [
    { id: 'date', header: 'Date', accessor: 'date', sortable: true, primary: true, cell: (v) => <span className="font-medium text-gray-900">{showDate(v.date)}</span> },
    { id: 'rep', header: 'Rep', accessor: 'rep', sortable: true },
    { id: 'duration', header: 'Duration', accessor: 'duration', hideBelow: 'sm' },
    { id: 'verified', header: 'Geo-verified', accessor: (v) => (v.verified ? 'Verified' : 'Not verified'),
      cell: (v) => v.verified ? <Badge tone="success" size="sm" icon={<Check />}>Verified</Badge> : <Badge tone="neutral" size="sm">Not verified</Badge> },
  ];

  if (loading) {
    return (
      <LoadingRegion label="Loading outlet" className="space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-14 w-14 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <StatGrid columns={4}>
          {[0, 1, 2, 3].map((i) => <StatCard key={i} label="" value="" loading />)}
        </StatGrid>
        <Skeleton className="h-10 w-full max-w-lg" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </LoadingRegion>
    );
  }

  if (loadError) {
    return (
      <PageSection>
        <PageHeader title="Outlet 360" back={{ href: '/dashboard/outlets', label: 'Outlets' }} />
        <ErrorState title="Couldn't load outlet" message={loadError} onRetry={fetchData} />
      </PageSection>
    );
  }

  if (!outlet) {
    return (
      <PageSection>
        <PageHeader title="Outlet 360" back={{ href: '/dashboard/outlets', label: 'Outlets' }} />
        <EmptyState
          bordered
          icon={<Store />}
          title="Outlet not found"
          description="This outlet may have been deleted, or you don't have any outlets yet."
        />
      </PageSection>
    );
  }

  return (
    <PageSection>
      <PageHeader
        title={
          <span className="flex min-w-0 items-center gap-3">
            <Avatar name={outlet.name} size="lg" shape="square" />
            <span className="min-w-0 truncate">{outlet.name}</span>
          </span>
        }
        back={{ href: '/dashboard/outlets', label: 'Outlets' }}
        description={
          <span className="flex flex-wrap items-center gap-2 pl-[3.75rem]">
            {outlet.code && <span className="tabular-nums">{outlet.code}</span>}
            <StatusPill status={outlet.status} size="sm" />
            {outlet.tier && <Badge tone="primary" size="sm">Tier {outlet.tier}</Badge>}
          </span>
        }
        actions={<Button variant="outline" leftIcon={<Pencil />} onClick={startEditing}>Edit details</Button>}
      />

      <StatGrid columns={4}>
        <StatCard label="Total orders" value={formatNumber(analytics?.totalOrders || 0)} icon={<ShoppingCart />} />
        <StatCard label="Avg order value" value={formatINR(analytics?.averageOrderValue || 0, { compact: true })} icon={<TrendingUp />} tone="success" />
        <StatCard label="Total revenue" value={formatINR(analytics?.totalRevenue || 0, { compact: true })} icon={<IndianRupee />} tone="info" />
        <StatCard
          label="Outstanding"
          value={formatINR(outlet.outstanding, { compact: true })}
          icon={<Wallet />}
          tone={outlet.outstanding > 0 ? 'warning' : 'neutral'}
          hint={outlet.creditLimit ? `of ${formatINR(outlet.creditLimit, { compact: true })} limit` : undefined}
        />
      </StatGrid>

      <div>
        <Tabs
          id="outlet-360"
          aria-label="Outlet details"
          value={activeSection}
          onValueChange={setActiveSection}
          items={[
            { value: 'identity', label: 'Identity' },
            { value: 'contact', label: 'Contact' },
            { value: 'commercial', label: 'Commercial' },
            { value: 'sales', label: 'Sales', count: orderHistory.length },
            { value: 'execution', label: 'Execution', count: visitHistory.length },
          ]}
        />

        <div className="mt-4">
          <TabPanel tabsId="outlet-360" value="identity" active={activeSection === 'identity'}>
            <Card>
              <CardHeader title="Identity" actions={<Button variant="ghost" size="sm" leftIcon={<Pencil />} onClick={startEditing}>Edit</Button>} />
              <CardBody>
                <DetailList items={[
                  { label: 'Code', value: outlet.code },
                  { label: 'Name', value: outlet.name },
                  { label: 'Owner', value: outlet.owner },
                  { label: 'Category', value: outlet.category },
                ]} />
              </CardBody>
            </Card>
          </TabPanel>

          <TabPanel tabsId="outlet-360" value="contact" active={activeSection === 'contact'}>
            <Card>
              <CardHeader title="Contact" />
              <CardBody>
                <DetailList items={[
                  { label: 'Mobile', value: outlet.mobile ? (
                    <a href={`tel:${outlet.mobile}`} className="inline-flex items-center gap-1.5 text-primary-600 hover:underline">
                      <Phone className="h-3.5 w-3.5" aria-hidden="true" />{outlet.mobile}
                    </a>
                  ) : null },
                  { label: 'Address', value: outlet.address },
                  { label: 'State', value: outlet.state },
                  { label: 'PIN code', value: outlet.pin },
                ]} />
              </CardBody>
            </Card>
          </TabPanel>

          <TabPanel tabsId="outlet-360" value="commercial" active={activeSection === 'commercial'}>
            <Card>
              <CardHeader title="Commercial" />
              <CardBody>
                <DetailList items={[
                  { label: 'Credit limit', value: <span className="tabular-nums">{formatINR(outlet.creditLimit)}</span> },
                  { label: 'Outstanding', value: <span className="tabular-nums text-warning-700">{formatINR(outlet.outstanding)}</span> },
                  { label: 'GSTIN', value: outlet.gstin ? <span className="font-mono text-xs">{outlet.gstin}</span> : null },
                  { label: 'Distributor', value: outlet.distributorId || <Badge tone="warning" size="sm">Unassigned</Badge> },
                ]} />
              </CardBody>
            </Card>
          </TabPanel>

          <TabPanel tabsId="outlet-360" value="sales" active={activeSection === 'sales'}>
            <DataTable
              caption="Order history"
              itemLabel="orders"
              data={orderHistory}
              columns={orderColumns}
              initialSort={{ id: 'date', direction: 'desc' }}
              mobileLayout="cards"
              emptyState={<EmptyState size="compact" icon={<ClipboardList />} title="No orders yet" description="Orders placed for this outlet will appear here." />}
            />
          </TabPanel>

          <TabPanel tabsId="outlet-360" value="execution" active={activeSection === 'execution'}>
            <DataTable
              caption="Visit history"
              itemLabel="visits"
              data={visitHistory}
              columns={visitColumns}
              getRowId={(_, i) => String(i)}
              mobileLayout="cards"
              emptyState={<EmptyState size="compact" icon={<MapPinned />} title="No visits yet" description="Rep check-ins at this outlet will appear here." />}
            />
          </TabPanel>
        </div>
      </div>

      <Modal
        open={isEditing}
        onClose={() => setIsEditing(false)}
        title="Edit outlet details"
        size="md"
        dismissible={!saving}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsEditing(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" form="edit-outlet-form" loading={saving} leftIcon={<Check />}>Save changes</Button>
          </>
        }
      >
        <form id="edit-outlet-form" noValidate onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4">
          {errorMessage && <Alert tone="danger" onDismiss={() => setErrorMessage('')}>{errorMessage}</Alert>}
          <Input id="edit-outlet-name" data-autofocus label="Outlet name" required value={editForm.name} error={nameError}
            onChange={(e) => { setEditForm({ ...editForm, name: e.target.value }); setNameError(''); }} />
          <Input label="Owner name" value={editForm.ownerName} onChange={(e) => setEditForm({ ...editForm, ownerName: e.target.value })} />
          <Input label="Category" value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} placeholder="Grocery, Chemist…" />
        </form>
      </Modal>
    </PageSection>
  );
}
