'use client';

import { useState, useEffect } from 'react';
import { OrdersService, InvoicesService } from '@bharatsales/api-client';
import { Order } from '@bharatsales/shared-types';
import { Loader2, ShoppingCart, Search, FileText, ChevronRight } from 'lucide-react';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await OrdersService.getOrders();
      setOrders(data || []);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await OrdersService.approveOrder(orderId);
      await fetchOrders();
    } catch (error) {
      console.error('Failed to approve order:', error);
      alert('Failed to approve order. Please check inventory stock.');
    }
  };

  const handleDispatch = async (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await OrdersService.dispatchOrder(orderId);
      await fetchOrders();
    } catch (error) {
      console.error('Failed to dispatch order:', error);
      alert('Failed to dispatch order. Please check reserved stock.');
    }
  };

  const handleGenerateInvoice = async (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await InvoicesService.generateInvoice(orderId);
      alert('Invoice generated successfully!');
      // optionally you could fetch orders again if we track invoicing status on the order itself
    } catch (error) {
      console.error('Failed to generate invoice:', error);
      alert('Failed to generate invoice. It may have already been generated.');
    }
  };

  const filteredOrders = orders.filter(order => 
    order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.outletId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'Submitted': return 'bg-blue-100 text-blue-800';
      case 'Approved': return 'bg-yellow-100 text-yellow-800';
      case 'Dispatched': return 'bg-purple-100 text-purple-800';
      case 'Delivered': return 'bg-green-100 text-green-800';
      case 'Cancelled': 
      case 'Rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800'; // Draft
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-500">Track and manage incoming orders from field reps.</p>
        </div>
        <div className="flex space-x-3">
          <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">📥 Export Report</button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-center">
          <div className="text-2xl font-bold text-gray-900">{orders.length}</div>
          <div className="text-sm text-gray-500">Total Orders</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-center">
          <div className="text-2xl font-bold text-blue-600">{orders.filter(o => o.status === 'Submitted').length}</div>
          <div className="text-sm text-gray-500">Pending Review</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-center">
          <div className="text-2xl font-bold text-yellow-600">{orders.filter(o => o.status === 'Approved').length}</div>
          <div className="text-sm text-gray-500">Approved</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-center">
          <div className="text-2xl font-bold text-green-600">{orders.filter(o => o.status === 'Delivered').length}</div>
          <div className="text-sm text-gray-500">Delivered</div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by Order ID or Outlet ID..."
            className="pl-10 w-full rounded-lg border-gray-200 focus:border-primary-500 focus:ring-primary-500 sm:text-sm h-10 border"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-gray-500">
                <th className="px-6 py-4 font-medium">Order ID</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Outlet</th>
                <th className="px-6 py-4 font-medium">Items</th>
                <th className="px-6 py-4 font-medium">Grand Total</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                 <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto" />
                    </td>
                </tr>
              ) : filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer">
                    <td className="px-6 py-4 font-medium text-primary-600 flex items-center">
                      <FileText className="w-4 h-4 mr-2 text-gray-400" />
                      {order.orderNumber || 'ORD-UNKNOWN'}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-gray-900 font-medium">{order.outletId}</td>
                    <td className="px-6 py-4 text-gray-600">{order.items?.length || 0}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">₹{order.totals?.grandTotal || 0}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center space-x-2">
                        {order.status === 'Submitted' && (
                          <button 
                            onClick={(e) => handleApprove(order.id, e)}
                            className="px-3 py-1 bg-blue-50 text-blue-600 rounded-md text-xs font-medium hover:bg-blue-100"
                          >
                            Approve
                          </button>
                        )}
                        {order.status === 'Approved' && (
                          <button 
                            onClick={(e) => handleDispatch(order.id, e)}
                            className="px-3 py-1 bg-purple-50 text-purple-600 rounded-md text-xs font-medium hover:bg-purple-100"
                          >
                            Dispatch
                          </button>
                        )}
                        {(order.status === 'Dispatched' || order.status === 'Delivered') && (
                          <button 
                            onClick={(e) => handleGenerateInvoice(order.id, e)}
                            className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-md text-xs font-medium hover:bg-indigo-100"
                          >
                            Generate Invoice
                          </button>
                        )}
                        <button className="text-gray-400 hover:text-primary-600">
                          <ChevronRight className="w-5 h-5 ml-2" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="text-gray-400 flex flex-col items-center">
                      <div className="bg-gray-50 p-3 rounded-full mb-3">
                        <ShoppingCart className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-sm font-medium text-gray-900 mb-1">No orders found</h3>
                      <p className="text-sm text-gray-500">Wait for field reps to start syncing their offline orders.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
