import { useState, useEffect, useCallback } from 'react';
import { OrdersService, OutletsService, ReturnsService } from '@bharatsales/api-client';
import { ReturnOrder } from '@bharatsales/shared-types';
import {
  Alert,
  Badge,
  type BadgeTone,
  Button,
  ConfirmDialog,
  DataTable,
  type DataTableColumn,
  EmptyState,
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
  formatDate,
  formatINR,
  formatNumber,
  useToast,
} from '@bharatsales/ui';
import { CheckCircle2, Clock, IndianRupee, Plus, RotateCcw, Undo2 } from 'lucide-react';
import { ErrorState, getErrorMessage } from '../../../components/common/ErrorState';

// Labels shown to the user → the status value stored on the return.
const STATUS_FILTERS = [
  { value: 'All Status', label: 'All statuses' },
  { value: 'Submitted', label: 'Submitted' },
  { value: 'Pending_Approval', label: 'Pending approval' },
  { value: 'Approved', label: 'Approved' },
  { value: 'Received', label: 'Received' },
  { value: 'Inspected', label: 'Inspected' },
  { value: 'Closed', label: 'Processed' },
  { value: 'Rejected', label: 'Rejected' },
];

const REASON_TONE: Record<string, BadgeTone> = { Expiry: 'danger', Quality: 'warning', Commercial: 'info' };

const CLASSIFICATIONS = [
  { value: 'saleable', label: 'Saleable' },
  { value: 'damaged', label: 'Damaged' },
  { value: 'quarantine', label: 'Quarantine' },
  { value: 'expired', label: 'Expired' },
  { value: 'return-to-vendor', label: 'Return to vendor' },
];

// A return is raised against a delivered order: the API needs orderId, the
// outlet's id and product ids, and prices the claim itself from the order.
const EMPTY_RETURN = { orderId: '', product: '', qty: 1, reason: 'Quality' };
const RETURNABLE_ORDER_STATUSES = ['Delivered', 'Partially_Delivered', 'Dispatched'];

interface OrderItemLite { productId: string; name?: string; sku?: string; quantity: number; unitPrice?: number }
interface OrderLite { id: string; orderNumber?: string; outletId: string; status: string; createdAt?: string; items?: OrderItemLite[] }

export default function ReturnsPage() {
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [returns, setReturns] = useState<ReturnOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<ReturnOrder | null>(null);
  const [classification, setClassification] = useState<Record<string, string>>({});

  // New Return Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [newReturn, setNewReturn] = useState(EMPTY_RETURN);
  const [orders, setOrders] = useState<OrderLite[]>([]);
  const [outletNames, setOutletNames] = useState<Map<string, string>>(new Map());
  const [lookupError, setLookupError] = useState('');

  // Orders feed the create form (and product names); outlets give display names.
  const fetchLookups = useCallback(() => {
    setLookupError('');
    Promise.allSettled([OrdersService.getOrders(), OutletsService.getOutlets()]).then(([o, out]) => {
      if (o.status === 'fulfilled') setOrders((o.value || []) as unknown as OrderLite[]);
      if (out.status === 'fulfilled') setOutletNames(new Map((out.value || []).map((x) => [String(x.id), x.name])));
      const failed = [o, out].find((r): r is PromiseRejectedResult => r.status === 'rejected');
      if (failed) setLookupError(getErrorMessage(failed.reason) ?? "Couldn't load your orders.");
    });
  }, []);

  useEffect(() => {
    fetchLookups();
  }, [fetchLookups]);

  const productNames = new Map<string, string>();
  orders.forEach((o) => o.items?.forEach((i) => i.name && productNames.set(String(i.productId), i.name)));
  const orderNumbers = new Map(orders.map((o) => [o.id, o.orderNumber]));
  const outletLabel = (id?: string) => (id ? outletNames.get(id) ?? id : '—');
  /** Card/row title: the outlet's name, else the order it came from. */
  const returnTitle = (r: ReturnOrder) => {
    const name = r.outlet ? outletNames.get(r.outlet) : undefined;
    if (name) return name;
    const orderNo = r.orderId ? orderNumbers.get(r.orderId) : undefined;
    return orderNo ? `Order ${orderNo}` : outletLabel(r.outlet);
  };
  const productLabel = (id?: string) => (id ? productNames.get(id) ?? id : 'Unknown product');

  const returnableOrders = orders.filter((o) => RETURNABLE_ORDER_STATUSES.includes(o.status));
  const selectedOrder = returnableOrders.find((o) => o.id === newReturn.orderId);
  const selectedItem = selectedOrder?.items?.find((i) => String(i.productId) === newReturn.product);

  const fetchReturns = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      const data = await ReturnsService.getReturns();
      setReturns(data);
    } catch (error) {
      console.error('Failed to fetch returns', error);
      setLoadError(getErrorMessage(error) ?? 'Failed to load returns.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReturns();
  }, [fetchReturns]);

  const filteredReturns = returns.filter((r) => {
    const matchesSearch = returnTitle(r).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All Status' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const shortId = (id: string) => id.substring(0, 8);

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    try {
      // The API only approves from Pending_Approval, so a freshly Submitted
      // return is moved there first.
      if (returns.find((r) => r.id === id)?.status === 'Submitted') {
        await ReturnsService.updateReturnStatus(id, 'Pending_Approval');
      }
      const updated = await ReturnsService.approveReturn(id);
      setReturns(returns.map((r) => (r.id === id ? updated : r)));
      toast.success(`Return ${shortId(id)} approved`);
    } catch (error) {
      console.error('Failed to approve return', error);
      toast.error(getErrorMessage(error) ?? 'Failed to approve return.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setProcessingId(id);
    try {
      const updated = await ReturnsService.rejectReturn(id);
      setReturns(returns.map((r) => (r.id === id ? updated : r)));
      toast.success(`Return ${shortId(id)} rejected`);
    } catch (error) {
      console.error('Failed to reject return', error);
      toast.error(getErrorMessage(error) ?? 'Failed to reject return.');
    } finally {
      setProcessingId(null);
      setRejectTarget(null);
    }
  };

  const handleUpdateStatus = async (id: string, status: string, classificationValue?: string) => {
    setProcessingId(id);
    try {
      const updated = await ReturnsService.updateReturnStatus(id, status, classificationValue);
      setReturns(returns.map((r) => (r.id === id ? updated : r)));
      toast.success(`Return ${shortId(id)} marked as ${status.toLowerCase()}`);
    } catch (error) {
      console.error(`Failed to mark return as ${status}`, error);
      toast.error(getErrorMessage(error) ?? 'Failed to update status.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleCreateReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !selectedItem) {
      setFormError('Choose the order and the product being returned.');
      return;
    }
    if (!newReturn.qty || newReturn.qty < 1 || newReturn.qty > selectedItem.quantity) {
      setFormError(`Quantity must be between 1 and ${selectedItem.quantity}.`);
      return;
    }
    setFormError('');

    try {
      setIsSubmitting(true);
      // The API prices the claim from the order and only accepts Draft/Submitted as the first status.
      const payload: Partial<ReturnOrder> = {
        orderId: selectedOrder.id,
        outlet: selectedOrder.outletId,
        reason: newReturn.reason as ReturnOrder['reason'],
        status: 'Submitted',
        items: [{ product: String(selectedItem.productId), qty: newReturn.qty }],
      };

      const created = await ReturnsService.createReturn(payload);
      setReturns([created, ...returns]);
      toast.success('Return created');
      setIsModalOpen(false);
      setNewReturn(EMPTY_RETURN);
    } catch (error) {
      console.error('Failed to create return:', error);
      setFormError(getErrorMessage(error) ?? 'Failed to create return.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openCreate = () => {
    setFormError('');
    setNewReturn(EMPTY_RETURN);
    setIsModalOpen(true);
  };

  const renderActions = (ret: ReturnOrder) => {
    const busy = processingId === ret.id;
    if (ret.status === 'Pending_Approval' || ret.status === 'Submitted') {
      return (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" disabled={busy} onClick={() => setRejectTarget(ret)}>
            Reject
          </Button>
          <Button size="sm" loading={busy && !rejectTarget} disabled={busy} onClick={() => handleApprove(ret.id)}>
            Approve
          </Button>
        </div>
      );
    }
    if (ret.status === 'Approved') {
      return (
        <Button size="sm" variant="outline" loading={busy} onClick={() => handleUpdateStatus(ret.id, 'Received')}>
          Receive goods
        </Button>
      );
    }
    if (ret.status === 'Received') {
      return (
        <div className="flex items-center justify-end gap-2">
          <Select
            size="sm"
            hideLabel
            label={`Classification for return ${shortId(ret.id)}`}
            options={CLASSIFICATIONS}
            value={classification[ret.id] || 'saleable'}
            onChange={(e) => setClassification({ ...classification, [ret.id]: e.target.value })}
            containerClassName="w-40"
          />
          <Button size="sm" loading={busy} onClick={() => handleUpdateStatus(ret.id, 'Inspected', classification[ret.id] || 'saleable')}>
            Inspect
          </Button>
        </div>
      );
    }
    if (ret.status === 'Inspected') {
      return (
        <Button size="sm" variant="outline" loading={busy} onClick={() => handleUpdateStatus(ret.id, 'Closed')}>
          Close return
        </Button>
      );
    }
    return <span className="text-foreground-subtle">—</span>;
  };

  const columns: DataTableColumn<ReturnOrder>[] = [
    {
      id: 'id',
      header: 'Return',
      accessor: 'id',
      primary: true,
      cell: (r) => (
        <div>
          <p className="font-medium text-gray-900">{returnTitle(r)}</p>
          <p className="text-xs text-foreground-subtle">
            #{shortId(r.id)} · {r.createdAt ? formatDate(r.createdAt) : 'Unknown date'}
          </p>
        </div>
      ),
    },
    {
      id: 'date',
      header: 'Date',
      accessor: 'createdAt',
      sortable: true,
      searchable: false,
      hideBelow: 'lg',
      hideInCard: true,
      cell: (r) => <span className="text-foreground-muted">{r.createdAt ? formatDate(r.createdAt) : '—'}</span>,
    },
    {
      id: 'product',
      header: 'Product',
      accessor: (r) => productLabel(r.items?.[0]?.product),
      hideBelow: 'md',
      cell: (r) => <span className="text-gray-700">{productLabel(r.items?.[0]?.product)}</span>,
    },
    {
      id: 'qty',
      header: 'Qty',
      accessor: (r) => r.items?.reduce((sum, item) => sum + item.qty, 0) || 0,
      align: 'right',
      sortable: true,
      searchable: false,
      hideBelow: 'md',
      cell: (r) => <span className="tabular-nums">{formatNumber(r.items?.reduce((sum, item) => sum + item.qty, 0) || 0)}</span>,
    },
    {
      id: 'reason',
      header: 'Reason',
      accessor: 'reason',
      cell: (r) => (
        <Badge size="sm" tone={REASON_TONE[r.reason] ?? 'neutral'}>
          {r.reason}
        </Badge>
      ),
    },
    {
      id: 'amount',
      header: 'Amount',
      accessor: (r) => parseFloat(r.value || '0'),
      align: 'right',
      sortable: true,
      searchable: false,
      cell: (r) => <span className="font-medium tabular-nums">{formatINR(parseFloat(r.value || '0'))}</span>,
    },
    { id: 'status', header: 'Status', accessor: 'status', searchable: false, cell: (r) => <StatusPill status={r.status} /> },
    { id: 'actions', header: <span className="sr-only">Actions</span>, align: 'right', cell: renderActions },
  ];

  const claimTotal = returns.reduce((s, r) => s + parseFloat(r.value || '0'), 0);
  const initialLoad = isLoading && returns.length === 0;
  const filtersActive = !!searchTerm || statusFilter !== 'All Status';

  return (
    <PageSection>
      <PageHeader
        title="Returns & claims"
        description={`Process returns and track claims · ${formatNumber(filteredReturns.length)} returns`}
        actions={
          <Button variant="accent" leftIcon={<Plus />} onClick={openCreate}>
            New return
          </Button>
        }
      />

      <StatGrid columns={4}>
        <StatCard label="Total returns" value={formatNumber(returns.length)} icon={<Undo2 />} loading={initialLoad} />
        <StatCard
          label="Pending"
          value={formatNumber(returns.filter((r) => r.status === 'Pending_Approval' || r.status === 'Submitted').length)}
          icon={<Clock />}
          tone="warning"
          loading={initialLoad}
          onClick={() => setStatusFilter('Pending_Approval')}
        />
        <StatCard
          label="Claim amount"
          value={formatINR(claimTotal, { compact: true })}
          hint={returns.length > 0 ? `Across ${formatNumber(returns.length)} return${returns.length === 1 ? '' : 's'}` : undefined}
          icon={<IndianRupee />}
          tone="info"
          loading={initialLoad}
        />
        <StatCard
          label="Processed"
          value={formatNumber(returns.filter((r) => r.status === 'Closed').length)}
          icon={<CheckCircle2 />}
          tone="success"
          loading={initialLoad}
          onClick={() => setStatusFilter('Closed')}
        />
      </StatGrid>

      <DataTable
        caption="Returns"
        itemLabel="returns"
        data={filteredReturns}
        columns={columns}
        getRowId={(r) => r.id}
        loading={initialLoad}
        error={loadError ? <ErrorState title="Couldn't load returns" message={loadError} onRetry={fetchReturns} className="border-0" /> : undefined}
        initialSort={{ id: 'date', direction: 'desc' }}
        mobileLayout="cards"
        toolbar={
          <Toolbar>
            <SearchInput
              value={searchTerm}
              onValueChange={setSearchTerm}
              placeholder="Search by outlet"
              aria-label="Search returns by outlet"
              containerClassName="w-full sm:max-w-sm"
            />
            <Select
              hideLabel
              label="Status"
              options={STATUS_FILTERS}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              containerClassName="w-full sm:w-48"
            />
          </Toolbar>
        }
        emptyState={
          filtersActive ? (
            <EmptyState
              icon={<RotateCcw />}
              title="No returns match"
              description="Try a different outlet name or status."
              action={
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('All Status');
                  }}
                >
                  Clear filters
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={<Undo2 />}
              title="No returns yet"
              description="Log a return when an outlet sends back damaged, expired or unsold stock."
              action={
                <Button leftIcon={<Plus />} onClick={openCreate}>
                  New return
                </Button>
              }
            />
          )
        }
      />

      {/* New Return Modal */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        dismissible={!isSubmitting}
        title="Create return"
        description="Record goods an outlet is sending back. It goes for approval first."
        footer={
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" form="new-return-form" loading={isSubmitting}>
              Create return
            </Button>
          </>
        }
      >
        <form id="new-return-form" onSubmit={handleCreateReturn} className="space-y-3">
          {formError && (
            <Alert tone="danger" onDismiss={() => setFormError('')}>
              {formError}
            </Alert>
          )}
          {lookupError && (
            <Alert tone="danger" title="Orders didn't load" actions={<Button size="sm" variant="outline" onClick={fetchLookups}>Try again</Button>}>
              {lookupError}
            </Alert>
          )}
          <Select
            label="Order"
            required
            data-autofocus
            placeholder={returnableOrders.length ? 'Select a delivered order' : 'No delivered orders yet'}
            disabled={returnableOrders.length === 0}
            helperText={returnableOrders.length === 0 ? 'Returns can be raised once an order has been dispatched or delivered.' : undefined}
            value={newReturn.orderId}
            onChange={(e) => setNewReturn({ ...newReturn, orderId: e.target.value, product: '', qty: 1 })}
            options={returnableOrders.map((o) => ({
              value: o.id,
              label: [o.orderNumber ?? `#${o.id.slice(-6)}`, outletNames.get(o.outletId), o.createdAt ? formatDate(o.createdAt) : null]
                .filter(Boolean)
                .join(' · '),
            }))}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              label="Product"
              required
              placeholder={selectedOrder ? 'Select product' : 'Choose an order first'}
              disabled={!selectedOrder}
              value={newReturn.product}
              onChange={(e) => setNewReturn({ ...newReturn, product: e.target.value, qty: 1 })}
              options={(selectedOrder?.items ?? []).map((i) => ({
                value: String(i.productId),
                label: `${i.name ?? i.sku ?? i.productId} (${formatNumber(i.quantity)} ordered)`,
              }))}
            />
            <Input
              label="Quantity"
              required
              type="number"
              inputMode="numeric"
              min={1}
              max={selectedItem?.quantity}
              value={newReturn.qty}
              onChange={(e) => setNewReturn({ ...newReturn, qty: Number(e.target.value) })}
            />
          </div>
          <Select
            label="Reason"
            value={newReturn.reason}
            onChange={(e) => setNewReturn({ ...newReturn, reason: e.target.value })}
            options={[
              { value: 'Quality', label: 'Quality / damage' },
              { value: 'Expiry', label: 'Expiry' },
              { value: 'Commercial', label: 'Commercial / unsold' },
            ]}
          />
          {selectedItem?.unitPrice != null && newReturn.qty > 0 && (
            <p className="text-sm text-foreground-muted">
              Estimated claim:{' '}
              <span className="font-medium tabular-nums text-gray-900">{formatINR(selectedItem.unitPrice * newReturn.qty)}</span>
              {' '}(final value is calculated from the order).
            </p>
          )}
        </form>
      </Modal>

      <ConfirmDialog
        open={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        tone="danger"
        title="Reject this return?"
        description={
          rejectTarget
            ? `The return from ${rejectTarget.outlet ? outletLabel(rejectTarget.outlet) : 'this outlet'} (${formatINR(parseFloat(rejectTarget.value || '0'))}) won't be credited.`
            : undefined
        }
        confirmLabel="Reject return"
        onConfirm={() => handleReject(rejectTarget!.id)}
      />
    </PageSection>
  );
}
