'use client';

import { useState, useEffect } from 'react';
import { Truck, Package, CheckCircle2 } from 'lucide-react';
import { OrdersService, DispatchService, OutletsService } from '@bharatsales/api-client';
import type { Order, Dispatch, Outlet } from '@bharatsales/shared-types';

export default function DeliveriesPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [loading, setLoading] = useState(true);

  const [dispatchTarget, setDispatchTarget] = useState<Order | null>(null);
  const [vehicle, setVehicle] = useState('');
  const [driver, setDriver] = useState('');

  const [deliveryTarget, setDeliveryTarget] = useState<Dispatch | null>(null);
  const [deliveryItems, setDeliveryItems] = useState<Record<string, { deliveredQty: number; damagedQty: number; reason: string }>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const outletName = (outletId: string) => outlets.find(o => o.id === outletId)?.name || outletId;

  const pendingDispatchOrders = orders.filter(o => o.status === 'Approved');
  const activeDispatches = dispatches.filter(d => d.status === 'Pending' || d.status === 'In Transit');
  const completedDispatches = dispatches.filter(d => d.status === 'Delivered' || d.status === 'Partial_Delivery');

  const openDispatchModal = (order: Order) => {
    setDispatchTarget(order);
    setVehicle('');
    setDriver('');
  };

  const handleDispatch = async () => {
    if (!dispatchTarget || !vehicle || !driver) return;
    try {
      await DispatchService.createDispatch({ orderId: dispatchTarget.id, vehicle, driver });
      setDispatchTarget(null);
      await fetchData();
    } catch (error) {
      console.error('Failed to dispatch order', error);
      alert('Failed to dispatch order. Please check reserved stock.');
    }
  };

  const openDeliveryModal = (dispatch: Dispatch) => {
    const order = orders.find(o => o.id === dispatch.orderId);
    const initial: Record<string, { deliveredQty: number; damagedQty: number; reason: string }> = {};
    (order?.items || []).forEach(item => {
      initial[item.productId] = { deliveredQty: item.quantity, damagedQty: 0, reason: '' };
    });
    setDeliveryItems(initial);
    setDeliveryTarget(dispatch);
  };

  const handleConfirmDelivery = async () => {
    if (!deliveryTarget) return;
    try {
      const items = Object.entries(deliveryItems).map(([productId, v]) => ({
        productId,
        deliveredQty: v.deliveredQty,
        damagedQty: v.damagedQty || undefined,
        reason: v.reason || undefined,
      }));
      await DispatchService.confirmDelivery(deliveryTarget.id, items);
      setDeliveryTarget(null);
      await fetchData();
    } catch (error) {
      console.error('Failed to confirm delivery', error);
      alert('Failed to confirm delivery.');
    }
  };

  const deliveryOrder = deliveryTarget ? orders.find(o => o.id === deliveryTarget.orderId) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Deliveries</h1>
        <p className="text-gray-500">Dispatch approved orders and confirm deliveries to your outlets.</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-center">
          <div className="text-2xl font-bold text-amber-600">{pendingDispatchOrders.length}</div>
          <div className="text-sm text-gray-500">Pending Dispatch</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-center">
          <div className="text-2xl font-bold text-blue-600">{activeDispatches.length}</div>
          <div className="text-sm text-gray-500">In Transit</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-center">
          <div className="text-2xl font-bold text-green-600">{completedDispatches.length}</div>
          <div className="text-sm text-gray-500">Delivered</div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-500">Loading deliveries...</div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100 font-medium text-gray-900">Ready to Dispatch</div>
            {pendingDispatchOrders.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-400 flex flex-col items-center">
                <Package className="w-8 h-8 mb-2" />
                No orders awaiting dispatch.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {pendingDispatchOrders.map(order => (
                  <div key={order.id} className="px-6 py-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{order.orderNumber}</p>
                      <p className="text-sm text-gray-500">{outletName(order.outletId)} • ₹{order.totals?.grandTotal?.toLocaleString() || 0}</p>
                    </div>
                    <button
                      onClick={() => openDispatchModal(order)}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700"
                    >
                      Dispatch
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100 font-medium text-gray-900">In Transit</div>
            {activeDispatches.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-400 flex flex-col items-center">
                <Truck className="w-8 h-8 mb-2" />
                No active deliveries.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {activeDispatches.map(dispatch => {
                  const order = orders.find(o => o.id === dispatch.orderId);
                  return (
                    <div key={dispatch.id} className="px-6 py-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{order?.orderNumber || dispatch.orderId}</p>
                        <p className="text-sm text-gray-500">{order ? outletName(order.outletId) : ''} • {dispatch.vehicle} ({dispatch.driver})</p>
                      </div>
                      <button
                        onClick={() => openDeliveryModal(dispatch)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                      >
                        Confirm Delivery
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Dispatch Modal */}
      {dispatchTarget && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Dispatch {dispatchTarget.orderNumber}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Number</label>
                <input
                  type="text"
                  value={vehicle}
                  onChange={e => setVehicle(e.target.value)}
                  className="w-full rounded-lg border-gray-200 border px-3 py-2 text-sm"
                  placeholder="e.g. DL-01-AB-1234"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Driver Name</label>
                <input
                  type="text"
                  value={driver}
                  onChange={e => setDriver(e.target.value)}
                  className="w-full rounded-lg border-gray-200 border px-3 py-2 text-sm"
                  placeholder="e.g. Ramesh Kumar"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-6 mt-4 border-t border-gray-100">
              <button onClick={() => setDispatchTarget(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button
                onClick={handleDispatch}
                disabled={!vehicle || !driver}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                Confirm Dispatch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delivery Modal */}
      {deliveryTarget && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" /> Confirm Delivery
            </h2>
            <div className="space-y-4">
              {(deliveryOrder?.items || []).map(item => (
                <div key={item.productId} className="border border-gray-100 rounded-lg p-3">
                  <p className="font-medium text-gray-900 text-sm mb-2">{item.name} (Ordered: {item.quantity})</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Delivered Qty</label>
                      <input
                        type="number"
                        min={0}
                        max={item.quantity}
                        value={deliveryItems[item.productId]?.deliveredQty ?? item.quantity}
                        onChange={e => setDeliveryItems(prev => ({
                          ...prev,
                          [item.productId]: { ...prev[item.productId], deliveredQty: Number(e.target.value) }
                        }))}
                        className="w-full rounded-lg border-gray-200 border px-2 py-1.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Damaged Qty</label>
                      <input
                        type="number"
                        min={0}
                        value={deliveryItems[item.productId]?.damagedQty ?? 0}
                        onChange={e => setDeliveryItems(prev => ({
                          ...prev,
                          [item.productId]: { ...prev[item.productId], damagedQty: Number(e.target.value) }
                        }))}
                        className="w-full rounded-lg border-gray-200 border px-2 py-1.5 text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end space-x-3 pt-6 mt-4 border-t border-gray-100">
              <button onClick={() => setDeliveryTarget(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button
                onClick={handleConfirmDelivery}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
              >
                Confirm Delivery
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
