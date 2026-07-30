import { useEffect, useState } from 'react';
import { Package } from 'lucide-react';
import { OrdersService } from '@bharatsales/api-client';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../database/db';
import type { Order } from '@bharatsales/shared-types';

const STATUS_STYLES: Record<string, string> = {
  Draft: 'bg-gray-100 text-gray-600',
  Submitted: 'bg-amber-50 text-amber-700',
  Pending_Approval: 'bg-amber-50 text-amber-700',
  Hold_Credit: 'bg-red-50 text-red-600',
  Hold_Stock: 'bg-red-50 text-red-600',
  Approved: 'bg-green-50 text-green-700',
  Dispatched: 'bg-blue-50 text-blue-700',
  Delivered: 'bg-green-100 text-green-800',
  Partial_Delivery: 'bg-blue-50 text-blue-700',
  Cancelled: 'bg-gray-100 text-gray-500',
  Rejected: 'bg-red-50 text-red-600',
};

export function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const outlets = useLiveQuery(() => db.outlets.toArray(), []) ?? [];

  useEffect(() => {
    OrdersService.getOrders({ mine: true })
      .then(setOrders)
      .catch(() => setError('Failed to load orders'))
      .finally(() => setLoading(false));
  }, []);

  const outletName = (outletId: string) => outlets.find(o => o.id === outletId)?.name || 'Unknown Outlet';
  const formatCurrency = (amount: number) => '₹' + amount.toLocaleString('en-IN');

  return (
    <div className="bg-slate-50 min-h-screen font-sans pb-24">
      <div className="bg-[#2D3A8C] px-5 pt-12 pb-6 shadow-md sticky top-0 z-40">
        <h1 className="text-white text-xl font-bold tracking-tight">My Orders</h1>
        <p className="text-white/80 text-sm mt-1">Orders you've booked</p>
      </div>

      <div className="px-5 py-6 space-y-3">
        {loading ? (
          <div className="text-center py-8 text-sm text-gray-500">Loading orders...</div>
        ) : error ? (
          <div className="text-center py-8 text-sm text-red-500">{error}</div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center border border-gray-100 shadow-sm">
            <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-500">No orders yet.</p>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <h3 className="font-bold text-[#1E293B] truncate">{outletName(order.outletId)}</h3>
                  <p className="text-xs text-[#64748B] mt-0.5">{order.orderNumber}</p>
                  <p className="text-xs text-[#64748B] mt-0.5">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-[#1E293B]">{formatCurrency(order.totals?.grandTotal || 0)}</p>
                  <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded ${STATUS_STYLES[order.status] || 'bg-gray-100 text-gray-600'}`}>
                    {order.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
