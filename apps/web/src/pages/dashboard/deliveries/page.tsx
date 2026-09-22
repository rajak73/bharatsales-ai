import { useState, useEffect } from 'react';
import { Truck, Package, CheckCircle2, Send } from 'lucide-react';
import { OrdersService, DispatchService, OutletsService } from '@bharatsales/api-client';
import type { Order, Dispatch, Outlet } from '@bharatsales/shared-types';
import {
  Alert,
  Button,
  DataTable,
  type DataTableColumn,
  EmptyState,
  Input,
  Modal,
  PageHeader,
  PageSection,
  StatCard,
  StatGrid,
  StatusPill,
  Tabs,
  formatDate,
  formatINR,
  formatNumber,
  useToast,
} from '@bharatsales/ui';
import { ErrorState, getErrorMessage } from '../../../components/common/ErrorState';

type DeliveryTab = 'ready' | 'transit' | 'delivered';

export default function DeliveriesPage() {
  const toast = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tab, setTab] = useState<DeliveryTab>('ready');

  const [dispatchTarget, setDispatchTarget] = useState<Order | null>(null);
  const [vehicle, setVehicle] = useState('');
  const [driver, setDriver] = useState('');
  const [dispatching, setDispatching] = useState(false);

  const [deliveryTarget, setDeliveryTarget] = useState<Dispatch | null>(null);
  const [deliveryItems, setDeliveryItems] = useState<Record<string, { deliveredQty: number; damagedQty: number; reason: string }>>({});
  const [confirming, setConfirming] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const [orderData, dispatchData, outletData] = await Promise.all([
        OrdersService.getOrders(),
        DispatchService.getDispatches(),
        OutletsService.getOutlets(),
      ]);
      setOrders(orderData || []);
      setDispatches(dispatchData || []);
      setOutlets(outletData || []);
    } catch (error) {
      console.error('Failed to fetch deliveries data:', error);
      setLoadError(getErrorMessage(error) ?? 'Failed to load deliveries.');
    } finally {
      setLoading(false);
    }
  };

  const outletName = (outletId: string) => outlets.find((o) => o.id === outletId)?.name || outletId;

  const pendingDispatchOrders = orders.filter((o) => o.status === 'Approved');
  const activeDispatches = dispatches.filter((d) => d.status === 'Pending' || d.status === 'In Transit');
  const completedDispatches = dispatches.filter((d) => d.status === 'Delivered' || d.status === 'Partial_Delivery');

  const openDispatchModal = (order: Order) => {
    setErrorMessage('');
    setDispatchTarget(order);
    setVehicle('');
    setDriver('');
  };

  const handleDispatch = async () => {
    if (!dispatchTarget || !vehicle || !driver) return;
    setErrorMessage('');
    setDispatching(true);
    try {
      await DispatchService.createDispatch({ orderId: dispatchTarget.id, vehicle, driver });
      toast.success(`${dispatchTarget.orderNumber || 'Order'} dispatched`);
      setDispatchTarget(null);
      await fetchData();
    } catch (error) {
      console.error('Failed to dispatch order', error);
      setErrorMessage('Failed to dispatch order. Please check reserved stock.');
    } finally {
      setDispatching(false);
    }
  };

  const openDeliveryModal = (dispatch: Dispatch) => {
    setErrorMessage('');
    const order = orders.find((o) => o.id === dispatch.orderId);
    const initial: Record<string, { deliveredQty: number; damagedQty: number; reason: string }> = {};
    (order?.items || []).forEach((item) => {
      initial[item.productId] = { deliveredQty: item.quantity, damagedQty: 0, reason: '' };
    });
    setDeliveryItems(initial);
    setDeliveryTarget(dispatch);
  };

  const handleConfirmDelivery = async () => {
    if (!deliveryTarget) return;
    setErrorMessage('');
    setConfirming(true);
    try {
      const items = Object.entries(deliveryItems).map(([productId, v]) => ({
        productId,
        deliveredQty: v.deliveredQty,
        damagedQty: v.damagedQty || undefined,
        reason: v.reason || undefined,
      }));
      await DispatchService.confirmDelivery(deliveryTarget.id, items);
      toast.success('Delivery confirmed');
      setDeliveryTarget(null);
      await fetchData();
    } catch (error) {
      console.error('Failed to confirm delivery', error);
      setErrorMessage('Failed to confirm delivery.');
    } finally {
      setConfirming(false);
    }
  };

  const deliveryOrder = deliveryTarget ? orders.find((o) => o.id === deliveryTarget.orderId) : null;
  const orderFor = (d: Dispatch) => orders.find((o) => o.id === d.orderId);
  const initialLoad = loading && orders.length === 0 && dispatches.length === 0;
  const errorNode = loadError ? (
    <ErrorState title="Couldn't load deliveries" message={loadError} onRetry={fetchData} className="border-0" />
  ) : undefined;

  const readyColumns: DataTableColumn<Order>[] = [
    {
      id: 'order',
      header: 'Order',
      accessor: 'orderNumber',
      primary: true,
      sortable: true,
      cell: (o) => <span className="font-medium text-gray-900">{o.orderNumber}</span>,
    },
    { id: 'outlet', header: 'Outlet', accessor: (o) => outletName(o.outletId), sortable: true },
    {
      id: 'date',
      header: 'Ordered',
      accessor: 'createdAt',
      sortable: true,
      hideBelow: 'md',
      cell: (o) => <span className="text-foreground-muted">{formatDate(o.createdAt)}</span>,
    },
    {
      id: 'amount',
      header: 'Amount',
      accessor: (o) => o.totals?.grandTotal ?? 0,
      align: 'right',
      sortable: true,
      cell: (o) => <span className="font-medium tabular-nums">{formatINR(o.totals?.grandTotal ?? 0)}</span>,
    },
    {
      id: 'actions',
      header: <span className="sr-only">Actions</span>,
      align: 'right',
      cell: (o) => (
        <Button size="sm" leftIcon={<Send />} onClick={() => openDispatchModal(o)} aria-label={`Dispatch ${o.orderNumber}`}>
          Dispatch
        </Button>
      ),
    },
  ];

  const dispatchColumns = (withAction: boolean): DataTableColumn<Dispatch>[] => [
    {
      id: 'order',
      header: 'Order',
      accessor: (d) => orderFor(d)?.orderNumber || d.orderId,
      primary: true,
      sortable: true,
      cell: (d) => <span className="font-medium text-gray-900">{orderFor(d)?.orderNumber || d.orderId}</span>,
    },
    {
      id: 'outlet',
      header: 'Outlet',
      accessor: (d) => {
        const order = orderFor(d);
        return order ? outletName(order.outletId) : '';
      },
      sortable: true,
      cell: (d) => {
        const order = orderFor(d);
        return order ? outletName(order.outletId) : '—';
      },
    },
    {
      id: 'vehicle',
      header: 'Vehicle / driver',
      accessor: (d) => `${d.vehicle} ${d.driver}`,
      hideBelow: 'md',
      cell: (d) => (
        <div>
          <p className="text-gray-700">{d.vehicle || '—'}</p>
          <p className="text-xs text-foreground-subtle">{d.driver}</p>
        </div>
      ),
    },
    { id: 'status', header: 'Status', accessor: 'status', searchable: false, cell: (d) => <StatusPill status={d.status} /> },
    ...(withAction
      ? [
          {
            id: 'actions',
            header: <span className="sr-only">Actions</span>,
            align: 'right' as const,
            cell: (d: Dispatch) => (
              <Button size="sm" variant="outline" leftIcon={<CheckCircle2 />} onClick={() => openDeliveryModal(d)}>
                Confirm delivery
              </Button>
            ),
          },
        ]
      : []),
  ];

  return (
    <PageSection>
      <PageHeader title="Deliveries" description="Dispatch approved orders and confirm deliveries to your outlets." />

      <StatGrid columns={3}>
        <StatCard
          label="Pending dispatch"
          value={formatNumber(pendingDispatchOrders.length)}
          icon={<Package />}
          tone="warning"
          loading={initialLoad}
          onClick={() => setTab('ready')}
        />
        <StatCard
          label="In transit"
          value={formatNumber(activeDispatches.length)}
          icon={<Truck />}
          tone="info"
          loading={initialLoad}
          onClick={() => setTab('transit')}
        />
        <StatCard
          label="Delivered"
          value={formatNumber(completedDispatches.length)}
          icon={<CheckCircle2 />}
          tone="success"
          loading={initialLoad}
          onClick={() => setTab('delivered')}
        />
      </StatGrid>

      <Tabs
        id="deliveries"
        aria-label="Delivery stages"
        value={tab}
        onValueChange={(v) => setTab(v as DeliveryTab)}
        items={[
          { value: 'ready', label: 'Ready to dispatch', count: pendingDispatchOrders.length },
          { value: 'transit', label: 'In transit', count: activeDispatches.length },
          { value: 'delivered', label: 'Delivered', count: completedDispatches.length },
        ]}
      />

      {tab === 'ready' && (
        <DataTable
          caption="Orders ready to dispatch"
          itemLabel="orders"
          data={pendingDispatchOrders}
          columns={readyColumns}
          getRowId={(o) => String(o.id)}
          loading={initialLoad}
          error={errorNode}
          initialSort={{ id: 'date', direction: 'asc' }}
          mobileLayout="cards"
          emptyState={
            <EmptyState
              icon={<Package />}
              title="No orders awaiting dispatch"
              description="Approved orders show up here, ready to be loaded onto a vehicle."
            />
          }
        />
      )}

      {tab === 'transit' && (
        <DataTable
          caption="Dispatches in transit"
          itemLabel="dispatches"
          data={activeDispatches}
          columns={dispatchColumns(true)}
          getRowId={(d) => String(d.id)}
          loading={initialLoad}
          error={errorNode}
          mobileLayout="cards"
          emptyState={
            <EmptyState
              icon={<Truck />}
              title="No active deliveries"
              description="Dispatch an approved order to start tracking it here."
              action={
                pendingDispatchOrders.length > 0 ? (
                  <Button variant="outline" onClick={() => setTab('ready')}>
                    View orders ready to dispatch
                  </Button>
                ) : undefined
              }
            />
          }
        />
      )}

      {tab === 'delivered' && (
        <DataTable
          caption="Completed deliveries"
          itemLabel="deliveries"
          data={completedDispatches}
          columns={dispatchColumns(false)}
          getRowId={(d) => String(d.id)}
          loading={initialLoad}
          error={errorNode}
          mobileLayout="cards"
          emptyState={<EmptyState icon={<CheckCircle2 />} title="No completed deliveries yet" />}
        />
      )}

      {/* Dispatch Modal */}
      <Modal
        open={!!dispatchTarget}
        onClose={() => setDispatchTarget(null)}
        dismissible={!dispatching}
        title={`Dispatch ${dispatchTarget?.orderNumber ?? ''}`}
        description={dispatchTarget ? `${outletName(dispatchTarget.outletId)} · ${formatINR(dispatchTarget.totals?.grandTotal ?? 0)}` : undefined}
        footer={
          <>
            <Button variant="outline" onClick={() => setDispatchTarget(null)} disabled={dispatching}>
              Cancel
            </Button>
            <Button type="submit" form="dispatch-form" loading={dispatching} disabled={!vehicle || !driver}>
              Confirm dispatch
            </Button>
          </>
        }
      >
        <form
          id="dispatch-form"
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            handleDispatch();
          }}
        >
          {errorMessage && (
            <Alert tone="danger" onDismiss={() => setErrorMessage('')}>
              {errorMessage}
            </Alert>
          )}
          <Input
            label="Vehicle number"
            required
            value={vehicle}
            onChange={(e) => setVehicle(e.target.value)}
            placeholder="e.g. DL-01-AB-1234"
            autoCapitalize="characters"
            data-autofocus
          />
          <Input
            label="Driver name"
            required
            value={driver}
            onChange={(e) => setDriver(e.target.value)}
            placeholder="e.g. Ramesh Kumar"
            autoComplete="off"
          />
        </form>
      </Modal>

      {/* Confirm Delivery Modal */}
      <Modal
        open={!!deliveryTarget}
        onClose={() => setDeliveryTarget(null)}
        dismissible={!confirming}
        size="lg"
        title="Confirm delivery"
        description={deliveryOrder ? `${deliveryOrder.orderNumber} · ${outletName(deliveryOrder.outletId)}` : undefined}
        footer={
          <>
            <Button variant="outline" onClick={() => setDeliveryTarget(null)} disabled={confirming}>
              Cancel
            </Button>
            <Button leftIcon={<CheckCircle2 />} loading={confirming} onClick={handleConfirmDelivery}>
              Confirm delivery
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {errorMessage && (
            <Alert tone="danger" onDismiss={() => setErrorMessage('')}>
              {errorMessage}
            </Alert>
          )}
          <p className="text-sm text-foreground-muted">Adjust quantities if the outlet received less than ordered or some units were damaged.</p>
          {(deliveryOrder?.items || []).map((item) => (
            <fieldset key={item.productId} className="rounded-lg border border-border p-3">
              <legend className="px-1 text-sm font-medium text-gray-900">
                {item.name} <span className="font-normal text-foreground-subtle">· Ordered {formatNumber(item.quantity)}</span>
              </legend>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  size="sm"
                  label="Delivered qty"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={item.quantity}
                  value={deliveryItems[item.productId]?.deliveredQty ?? item.quantity}
                  onChange={(e) =>
                    setDeliveryItems((prev) => ({
                      ...prev,
                      [item.productId]: { ...prev[item.productId], deliveredQty: Number(e.target.value) },
                    }))
                  }
                />
                <Input
                  size="sm"
                  label="Damaged qty"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={deliveryItems[item.productId]?.damagedQty ?? 0}
                  onChange={(e) =>
                    setDeliveryItems((prev) => ({
                      ...prev,
                      [item.productId]: { ...prev[item.productId], damagedQty: Number(e.target.value) },
                    }))
                  }
                />
              </div>
            </fieldset>
          ))}
          {(deliveryOrder?.items || []).length === 0 && (
            <p className="text-sm text-foreground-subtle">No line items found for this order.</p>
          )}
        </div>
      </Modal>
    </PageSection>
  );
}
