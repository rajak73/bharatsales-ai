'use client';

import { useState, useEffect } from 'react';
import { OrdersService, InvoicesService } from '@bharatsales/api-client';
import { Order, OrderLineItem } from '@bharatsales/shared-types';
import { Loader2, ShoppingCart, Search, FileText, ChevronRight, X, Check } from 'lucide-react';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState<{ role: string } | null>(null);
  
  // Detail view state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    // Decode user role from JWT
    try {
      const token = localStorage.getItem('bharatsales_token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({ role: payload.role });
      }
    } catch (e) {
      console.error(e);
    }
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await OrdersService.getOrders();
      setOrders(data || []);
      
      // Update selected order if one is selected
      if (selectedOrder) {
        const updated = data?.find((o: Order) => o.id === selectedOrder.id);
        if (updated) setSelectedOrder(updated);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (orderId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await OrdersService.approveOrder(orderId);
      await fetchOrders();
    } catch (error) {
      console.error('Failed to approve order:', error);
      alert('Failed to approve order. Please check inventory stock.');
    }
  };

  const handleDispatch = async (orderId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await OrdersService.dispatchOrder(orderId);
      await fetchOrders();
    } catch (error) {
      console.error('Failed to dispatch order:', error);
      alert('Failed to dispatch order. Please check reserved stock.');
    }
  };

  const handleGenerateInvoice = async (orderId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await InvoicesService.generateInvoice(orderId);
      alert('Invoice generated successfully!');
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

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Order List */}
        <div className={`bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden p-0 ${selectedOrder ? 'lg:col-span-1' : 'lg:col-span-3'}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-gray-500">
                  <th className="px-6 py-4 font-medium">Order ID</th>
                  {!selectedOrder && <th className="px-6 py-4 font-medium">Date</th>}
                  {!selectedOrder && <th className="px-6 py-4 font-medium">Outlet</th>}
                  <th className="px-6 py-4 font-medium">Total</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                   <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                          <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto" />
                      </td>
                  </tr>
                ) : filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => (
                    <tr 
                      key={order.id} 
                      onClick={() => setSelectedOrder(order.id === selectedOrder?.id ? null : order)}
                      className={`border-t border-gray-100 hover:bg-gray-50 cursor-pointer transition-all ${selectedOrder?.id === order.id ? 'bg-primary-50 border-l-4 border-l-primary-500' : ''}`}
                    >
                      <td className="px-6 py-4 font-medium text-primary-600">
                        {order.orderNumber || order.id?.slice(-6).toUpperCase()}
                      </td>
                      {!selectedOrder && <td className="px-6 py-4 text-gray-600">{new Date(order.createdAt).toLocaleDateString()}</td>}
                      {!selectedOrder && <td className="px-6 py-4 text-gray-900 font-medium">{order.outletId}</td>}
                      <td className="px-6 py-4 font-medium text-gray-900">₹{order.totals?.grandTotal?.toLocaleString() || 0}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
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

        {/* Order Details Pane */}
        {selectedOrder && (
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 flex items-center">
                    {selectedOrder.orderNumber || selectedOrder.id}
                    <span className={`ml-3 inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                      {selectedOrder.status}
                    </span>
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">Outlet: {selectedOrder.outletId} | Placed: {new Date(selectedOrder.createdAt).toLocaleString()}</p>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-x-auto mb-6">
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-gray-50">
                    <tr className="text-left text-gray-500">
                      <th className="px-4 py-2 font-medium">Product</th>
                      <th className="px-4 py-2 font-medium text-right">Quantity</th>
                      <th className="px-4 py-2 font-medium text-right">Price</th>
                      <th className="px-4 py-2 font-medium text-right">Total</th>
                      {user?.role === 'Distributor' && selectedOrder.status === 'Submitted' && (
                        <th className="px-4 py-2 font-medium">Batch (FEFO)</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedOrder.items || []).map((item: OrderLineItem, index: number) => (
                      <tr key={index} className="border-t border-gray-100">
                        <td className="px-4 py-3 font-medium text-gray-900">{item.productId}</td>
                        <td className="px-4 py-3 text-right">{item.quantity}</td>
                        <td className="px-4 py-3 text-right">₹{item.unitPrice}</td>
                        <td className="px-4 py-3 text-right font-medium">₹{item.total}</td>
                        {user?.role === 'Distributor' && selectedOrder.status === 'Submitted' && (
                          <td className="px-4 py-3">
                            <select className="w-full rounded-md border-gray-200 text-xs py-1 px-2 border focus:border-primary-500 focus:ring-primary-500">
                              <option>Auto (FEFO)</option>
                            </select>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center border-t border-gray-100 pt-4 mt-4">
                <div className="text-lg font-bold text-gray-900">
                  Grand Total: ₹{selectedOrder.totals?.grandTotal?.toLocaleString() || 0}
                </div>
                <div className="flex space-x-3">
                  {selectedOrder.status === 'Submitted' && (
                    <button 
                      onClick={() => handleApprove(selectedOrder.id!)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      {user?.role === 'Distributor' ? 'Confirm & Allocate' : 'Approve Order'}
                    </button>
                  )}
                  {selectedOrder.status === 'Approved' && (
                    <button 
                      onClick={() => handleDispatch(selectedOrder.id!)}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
                    >
                      Mark Dispatched
                    </button>
                  )}
                  {(selectedOrder.status === 'Dispatched' || selectedOrder.status === 'Delivered') && (
                    <button 
                      onClick={() => handleGenerateInvoice(selectedOrder.id!)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
                    >
                      Generate Invoice
                    </button>
                  )}
                </div>
              </div>

              {user?.role === 'Distributor' && selectedOrder.status === 'Submitted' && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-6">
                  <h4 className="font-medium text-blue-800 mb-1 text-sm">FEFO Allocation active</h4>
                  <p className="text-xs text-blue-700">Batches are automatically allocated using First-Expired-First-Out logic based on inventory ledgers.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
