'use client';

import { useState, useEffect } from 'react';
import { OrdersService, OutletsService } from '@bharatsales/api-client';
import type { Order, Outlet } from '@bharatsales/shared-types';
import { Loader2, TrendingUp, ShoppingCart, Clock, IndianRupee } from 'lucide-react';

const STATUS_ORDER = ['Draft', 'Submitted', 'Pending_Approval', 'Hold_Credit', 'Hold_Stock', 'Approved', 'Dispatched', 'Partial_Delivery', 'Delivered', 'Cancelled', 'Rejected'];

export default function SalesPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [orderData, outletData] = await Promise.all([
        OrdersService.getOrders(),
        OutletsService.getOutlets(),
      ]);
      setOrders(orderData || []);
      setOutlets(outletData || []);
    } catch (error) {
      console.error('Failed to fetch sales data:', error);
    } finally {
      setLoading(false);
    }
  };

  const outletName = (outletId: string) => outlets.find(o => o.id === outletId)?.name || outletId;

  const totalOrders = orders.length;
  const totalSalesValue = orders.reduce((sum, o) => sum + (o.totals?.grandTotal || 0), 0);
  const pendingApproval = orders.filter(o => o.status === 'Submitted' || o.status === 'Pending_Approval').length;
  const avgOrderValue = totalOrders > 0 ? totalSalesValue / totalOrders : 0;

  const statusBreakdown = STATUS_ORDER
    .map(status => ({ status, count: orders.filter(o => o.status === status).length }))
    .filter(s => s.count > 0);

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sales</h1>
        <p className="text-gray-500">Order volume and sales activity across your organization.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-3 mb-3 text-blue-600">
            <div className="p-3 bg-blue-50 rounded-lg"><ShoppingCart className="w-5 h-5" /></div>
            <span className="text-sm font-medium text-gray-500">Total Orders</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{totalOrders}</div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3 mb-3 text-purple-600">
            <div className="p-3 bg-purple-50 rounded-lg"><TrendingUp className="w-5 h-5" /></div>
            <span className="text-sm font-medium text-gray-500">Total Sales Value</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">₹{totalSalesValue.toLocaleString()}</div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3 mb-3 text-amber-600">
            <div className="p-3 bg-amber-50 rounded-lg"><Clock className="w-5 h-5" /></div>
            <span className="text-sm font-medium text-gray-500">Pending Approval</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{pendingApproval}</div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3 mb-3 text-green-600">
            <div className="p-3 bg-green-50 rounded-lg"><IndianRupee className="w-5 h-5" /></div>
            <span className="text-sm font-medium text-gray-500">Average Order Value</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">₹{Math.round(avgOrderValue).toLocaleString()}</div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="card md:col-span-1">
          <h3 className="font-bold text-gray-900 mb-4">Orders by Status</h3>
          {statusBreakdown.length === 0 ? (
            <p className="text-sm text-gray-400">No orders yet.</p>
          ) : (
            <div className="space-y-3">
              {statusBreakdown.map(({ status, count }) => (
                <div key={status} className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">{status.replace(/_/g, ' ')}</span>
                  <span className="font-medium text-gray-900">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card md:col-span-2 overflow-hidden p-0">
          <div className="px-6 py-4 border-b border-gray-100 font-bold text-gray-900">Recent Orders</div>
          {recentOrders.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-400">No orders yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-left text-gray-500">
                    <th className="px-6 py-3 font-medium">Order #</th>
                    <th className="px-6 py-3 font-medium">Outlet</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium text-right">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="px-6 py-3 font-medium text-primary-600">{order.orderNumber}</td>
                      <td className="px-6 py-3 text-gray-600">{outletName(order.outletId)}</td>
                      <td className="px-6 py-3 text-gray-600">{order.status.replace(/_/g, ' ')}</td>
                      <td className="px-6 py-3 text-right font-medium text-gray-900">₹{(order.totals?.grandTotal || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
