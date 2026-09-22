import { useState, useEffect, useCallback, useMemo } from 'react';
import { OrdersService, InventoryService } from '@bharatsales/api-client';
import { Order, OrderLineItem, Inventory } from '@bharatsales/shared-types';
import {
  Alert,
  Button,
  ConfirmDialog,
  DataTable,
  type DataTableColumn,
  Drawer,
  EmptyState,
  PageHeader,
  PageSection,
  SearchInput,
  Select,
  StatCard,
  StatGrid,
  StatusPill,
  Tabs,
  Textarea,
  Toolbar,
  formatDate,
  formatDateTime,
  formatINR,
  formatNumber,
  useToast,
} from '@bharatsales/ui';
import { Check, CheckCircle2, ClipboardList, Clock, ShoppingCart, X } from 'lucide-react';
import { useCurrentUser } from '../../../contexts/CurrentUserContext';
import { ErrorState, getErrorMessage } from '../../../components/common/ErrorState';

type StatusFilter = 'all' | 'pending' | 'approved' | 'dispatched' | 'delivered' | 'closed';

const STATUS_GROUPS: Record<Exclude<StatusFilter, 'all'>, Order['status'][]> = {
  pending: ['Submitted', 'Pending_Approval', 'Hold_Credit', 'Hold_Stock'],
  approved: ['Approved'],
  dispatched: ['Dispatched', 'Partial_Delivery'],
  delivered: ['Delivered'],
  closed: ['Cancelled', 'Rejected'],
};

const orderLabel = (o: Order) => o.orderNumber || o.id?.slice(-6).toUpperCase() || '—';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [loadError, setLoadError] = useState<string | null>(null);
  const user = useCurrentUser();
  const toast = useToast();

  // Detail view state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [productBatches, setProductBatches] = useState<Record<string, Inventory[]>>({});
  const [actionError, setActionError] = useState('');
  const [approving, setApproving] = useState(false);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  const [confirmRejectId, setConfirmRejectId] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (selectedOrder && user?.role === 'Distributor' && selectedOrder.status === 'Submitted') {
      const fetchBatches = async () => {
        const batchesMap: Record<string, Inventory[]> = {};
        for (const item of selectedOrder.items || []) {
          try {
            const batches = await InventoryService.getBatches(item.productId);
            batchesMap[item.productId] = batches;
          } catch {
            /* batch list is optional */
          }
        }
        setProductBatches(batchesMap);
      };
      fetchBatches();
    }
  }, [selectedOrder, user]);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const data = await OrdersService.getOrders();
      setOrders(data || []);

      // Refresh the open detail panel with the latest copy of that order.
      // Functional update so this callback doesn't depend on selectedOrder
      // (which it sets) — that dependency caused an infinite refetch loop.
      setSelectedOrder((current) => {
        if (!current) return current;
        return data?.find((o: Order) => o.id === current.id) ?? current;
      });
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      setLoadError(getErrorMessage(error) ?? 'Failed to load orders.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleApprove = async (orderId: string) => {
    setActionError('');
    setApproving(true);
    try {
      await OrdersService.approveOrder(orderId);
      toast.success(user?.role === 'Distributor' ? 'Order confirmed and stock allocated' : 'Order approved');
      await fetchOrders();
    } catch (error: unknown) {
      console.error('Failed to approve order:', error);
      setActionError(getErrorMessage(error) || 'Failed to approve order. Please check inventory stock.');
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async (orderId: string) => {
    setActionError('');
    try {
      await OrdersService.rejectOrder(orderId, reason.trim() || undefined);
      toast.success('Order rejected');
      setConfirmRejectId(null);
      await fetchOrders();
    } catch (error: unknown) {
      console.error('Failed to reject order:', error);
      toast.error(getErrorMessage(error) || 'Failed to reject order.');
    }
  };

  const handleCancel = async (orderId: string) => {
    setActionError('');
    try {
      await OrdersService.cancelOrder(orderId, reason.trim() || undefined);
      toast.success('Order cancelled');
      await fetchOrders();
    } catch (error: unknown) {
      console.error('Failed to cancel order:', error);
      toast.error(getErrorMessage(error) || 'Failed to cancel order.');
    } finally {
      setConfirmCancelId(null);
    }
  };

  const counts = useMemo(() => {
    const c: Record<StatusFilter, number> = { all: orders.length, pending: 0, approved: 0, dispatched: 0, delivered: 0, closed: 0 };
    for (const o of orders) {
      for (const [key, statuses] of Object.entries(STATUS_GROUPS)) {
        if (statuses.includes(o.status)) c[key as StatusFilter] += 1;
      }
    }
    return c;
  }, [orders]);

  const visibleOrders = useMemo(
    () => (statusFilter === 'all' ? orders : orders.filter((o) => STATUS_GROUPS[statusFilter].includes(o.status))),
    [orders, statusFilter],
  );

  const columns: DataTableColumn<Order>[] = [
    {
      id: 'order',
      header: 'Order',
      accessor: (o) => o.orderNumber || o.id,
      sortable: true,
      primary: true,
      cell: (o) => <span className="font-medium text-gray-900">{orderLabel(o)}</span>,
    },
    {
      id: 'date',
      header: 'Date',
      accessor: 'createdAt',
      sortable: true,
      searchable: false,
      cell: (o) => <span className="text-foreground-muted">{formatDate(o.createdAt)}</span>,
    },
    {
      id: 'outlet',
      header: 'Outlet',
      accessor: 'outletId',
      hideBelow: 'md',
      cell: (o) => <span className="text-gray-700">{o.outletId || '—'}</span>,
    },
    {
      id: 'total',
      header: 'Amount',
      accessor: (o) => o.totals?.grandTotal ?? 0,
      align: 'right',
      sortable: true,
      searchable: false,
      cell: (o) => <span className="font-medium tabular-nums text-gray-900">{formatINR(o.totals?.grandTotal ?? 0)}</span>,
    },
    {
      id: 'status',
      header: 'Status',
      accessor: 'status',
      searchable: false,
      cell: (o) => <StatusPill status={o.status} />,
    },
  ];

  const showBatchPicker = user?.role === 'Distributor' && selectedOrder?.status === 'Submitted';
  const initialLoad = loading && orders.length === 0;
  const canCancel = !!selectedOrder && ['Draft', 'Submitted'].includes(selectedOrder.status);
  const canReview = selectedOrder?.status === 'Submitted';

  const closeDrawer = () => {
    setSelectedOrder(null);
    setActionError('');
  };

  return (
    <PageSection>
      <PageHeader title="Orders" description="Track and manage incoming orders from field reps." />

      <StatGrid columns={4}>
        <StatCard label="Total orders" value={formatNumber(orders.length)} icon={<ShoppingCart />} loading={initialLoad} />
        <StatCard
          label="Pending review"
          value={formatNumber(orders.filter((o) => o.status === 'Submitted').length)}
          icon={<Clock />}
          tone="warning"
          loading={initialLoad}
          onClick={() => setStatusFilter('pending')}
        />
        <StatCard
          label="Approved"
          value={formatNumber(orders.filter((o) => o.status === 'Approved').length)}
          icon={<ClipboardList />}
          tone="info"
          loading={initialLoad}
          onClick={() => setStatusFilter('approved')}
        />
        <StatCard
          label="Delivered"
          value={formatNumber(orders.filter((o) => o.status === 'Delivered').length)}
          icon={<CheckCircle2 />}
          tone="success"
          loading={initialLoad}
          onClick={() => setStatusFilter('delivered')}
        />
      </StatGrid>

      <DataTable
        caption="Orders"
        itemLabel="orders"
        data={visibleOrders}
        columns={columns}
        getRowId={(o) => String(o.id)}
        loading={initialLoad}
        error={
          loadError ? <ErrorState title="Couldn't load orders" message={loadError} onRetry={fetchOrders} className="border-0" /> : undefined
        }
        globalFilter={searchTerm}
        initialSort={{ id: 'date', direction: 'desc' }}
        onRowClick={(o) => setSelectedOrder(o.id === selectedOrder?.id ? null : o)}
        selectedRowId={selectedOrder?.id ?? null}
        mobileLayout="cards"
        toolbar={
          <div className="space-y-3">
            <Tabs
              id="order-status"
              aria-label="Filter orders by status"
              variant="pills"
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as StatusFilter)}
              items={[
                { value: 'all', label: 'All', count: counts.all },
                { value: 'pending', label: 'Pending', count: counts.pending },
                { value: 'approved', label: 'Approved', count: counts.approved },
                { value: 'dispatched', label: 'Dispatched', count: counts.dispatched },
                { value: 'delivered', label: 'Delivered', count: counts.delivered },
                { value: 'closed', label: 'Cancelled / rejected', count: counts.closed },
              ]}
            />
            <Toolbar>
              <SearchInput
                value={searchTerm}
                onValueChange={setSearchTerm}
                placeholder="Search order no. or outlet ID"
                aria-label="Search orders"
                containerClassName="w-full sm:max-w-sm"
              />
            </Toolbar>
          </div>
        }
        emptyState={
          <EmptyState
            icon={<ShoppingCart />}
            title={statusFilter === 'all' ? 'No orders yet' : 'No orders with this status'}
            description={
              statusFilter === 'all'
                ? 'Orders appear here once field reps sync the orders they book at outlets.'
                : 'Try another status, or view all orders.'
            }
            action={
              statusFilter !== 'all' ? (
                <Button variant="outline" onClick={() => setStatusFilter('all')}>
                  View all orders
                </Button>
              ) : undefined
            }
          />
        }
      />

      {/* Order detail */}
      <Drawer
        open={!!selectedOrder}
        onClose={closeDrawer}
        size="lg"
        dismissible={!approving}
        title={selectedOrder ? `Order ${orderLabel(selectedOrder)}` : 'Order'}
        description={
          selectedOrder ? (
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <StatusPill status={selectedOrder.status} />
              <span>Placed {formatDateTime(selectedOrder.createdAt)}</span>
            </span>
          ) : undefined
        }
        footer={
          selectedOrder && (canCancel || canReview) ? (
            <>
              {canCancel && (
                <Button
                  variant="ghost"
                  disabled={approving}
                  onClick={() => {
                    setReason('');
                    setConfirmCancelId(selectedOrder.id!);
                  }}
                >
                  Cancel order
                </Button>
              )}
              {canReview && (
                <Button
                  variant="outline"
                  leftIcon={<X />}
                  disabled={approving}
                  onClick={() => {
                    setReason('');
                    setConfirmRejectId(selectedOrder.id!);
                  }}
                >
                  Reject
                </Button>
              )}
              {canReview && (
                <Button leftIcon={<Check />} loading={approving} onClick={() => handleApprove(selectedOrder.id!)}>
                  {user?.role === 'Distributor' ? 'Confirm & allocate' : 'Approve order'}
                </Button>
              )}
            </>
          ) : undefined
        }
      >
        {selectedOrder && (
          <div className="space-y-4">
            {actionError && (
              <Alert tone="danger" title="Couldn't approve this order" onDismiss={() => setActionError('')}>
                {actionError}
              </Alert>
            )}

            <dl className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-surface-muted p-4 text-sm">
              <div className="min-w-0">
                <dt className="text-foreground-subtle">Outlet</dt>
                <dd className="mt-0.5 truncate font-medium text-gray-900">{selectedOrder.outletId || '—'}</dd>
              </div>
              <div className="text-right">
                <dt className="text-foreground-subtle">Grand total</dt>
                <dd className="mt-0.5 text-lg font-semibold tabular-nums text-gray-900">
                  {formatINR(selectedOrder.totals?.grandTotal ?? 0)}
                </dd>
              </div>
            </dl>

            <section aria-labelledby="order-items-heading">
              <h3 id="order-items-heading" className="mb-3 text-sm font-semibold text-gray-900">
                Items ({formatNumber((selectedOrder.items || []).length)})
              </h3>
              <ul className="divide-y divide-border rounded-xl border border-border">
                {(selectedOrder.items || []).map((item: OrderLineItem, index: number) => (
                  <li key={index} className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="break-words font-medium text-gray-900">{item.name || item.sku || item.productId}</p>
                        {item.sku && item.name && <p className="text-xs text-foreground-subtle">{item.sku}</p>}
                        <p className="mt-0.5 text-sm tabular-nums text-foreground-subtle">
                          {formatNumber(item.quantity)} × {formatINR(item.unitPrice)}
                        </p>
                      </div>
                      <p className="shrink-0 font-semibold tabular-nums text-gray-900">{formatINR(item.total)}</p>
                    </div>

                    {showBatchPicker && (
                      <Select
                        size="sm"
                        label={`Batch for ${item.name || item.sku || item.productId}`}
                        hideLabel
                        options={[
                          { value: '', label: 'Auto (FEFO)' },
                          ...(productBatches[item.productId] || []).map((b) => ({
                            value: b.batch,
                            label: `${b.batch} (Stock: ${formatNumber(b.stock)})`,
                          })),
                        ]}
                      />
                    )}

                    {item.allocations && item.allocations.length > 0 && (
                      <div className="rounded-lg bg-surface-muted p-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground-subtle">Batch allocation (FEFO)</p>
                        <ul className="space-y-1.5">
                          {item.allocations.map((alloc, idx) => (
                            <li key={idx} className="flex flex-wrap items-center gap-2 text-sm text-foreground-muted">
                              <span className="rounded-md border border-border bg-white px-2 py-0.5 text-xs font-medium text-gray-700">
                                {alloc.batch}
                              </span>
                              <span>
                                <strong className="tabular-nums text-gray-900">{formatNumber(alloc.quantity)}</strong> units allocated
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </li>
                ))}
                {(selectedOrder.items || []).length === 0 && (
                  <li className="p-4 text-sm text-foreground-subtle">This order has no items.</li>
                )}
              </ul>
            </section>

            {showBatchPicker && (
              <Alert tone="info" title="FEFO allocation is on">
                Batches are allocated automatically on a first-expired, first-out basis from your inventory ledger.
              </Alert>
            )}
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        open={!!confirmRejectId}
        onClose={() => setConfirmRejectId(null)}
        tone="danger"
        title="Reject this order?"
        description="The rep will see the order as rejected. This can't be undone."
        confirmLabel="Reject order"
        cancelLabel="Keep order"
        onConfirm={() => handleReject(confirmRejectId!)}
      >
        <Textarea label="Reason" optional rows={3} value={reason} onChange={(e) => setReason(e.target.value)} data-autofocus />
      </ConfirmDialog>

      <ConfirmDialog
        open={!!confirmCancelId}
        onClose={() => setConfirmCancelId(null)}
        tone="danger"
        title="Cancel this order?"
        description="This action can't be undone."
        confirmLabel="Cancel order"
        cancelLabel="Keep order"
        onConfirm={() => handleCancel(confirmCancelId!)}
      >
        <Textarea label="Reason" optional rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
      </ConfirmDialog>

    </PageSection>
  );
}
