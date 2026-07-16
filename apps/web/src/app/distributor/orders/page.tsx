'use client';

import { useState } from 'react';

export default function DistributorOrdersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  const orders = [
    { id: 'ORD-2401', outlet: 'Sharma General Store', amount: 12400, items: 8, status: 'Pending Confirmation', date: '14 Jul 2026', priority: 'High' },
    { id: 'ORD-2400', outlet: 'Patel Medical Hall', amount: 8750, items: 5, status: 'Pending Confirmation', date: '14 Jul 2026', priority: 'Medium' },
    { id: 'ORD-2399', outlet: 'Gupta Kirana', amount: 15200, items: 12, status: 'Allocated', date: '14 Jul 2026', priority: 'High' },
    { id: 'ORD-2398', outlet: 'Singh Electronics', amount: 22100, items: 15, status: 'Ready to Dispatch', date: '14 Jul 2026', priority: 'High' },
    { id: 'ORD-2397', outlet: 'Mishra Traders', amount: 6800, items: 4, status: 'Dispatched', date: '14 Jul 2026', priority: 'Low' },
  ];

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.outlet.toLowerCase().includes(searchTerm.toLowerCase()) || o.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All Status' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleConfirm = (id: string) => {
    setSuccessMessage(`Order ${id} confirmed and allocated!`);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  return (
    <div className="space-y-6">
      {successMessage && (<div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between"><div className="flex items-center space-x-2"><span className="text-green-600">✅</span><span className="text-sm text-green-800 font-medium">{successMessage}</span></div><button onClick={() => setSuccessMessage('')} className="text-green-600 hover:text-green-800">✕</button></div>)}

      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-gray-900">Order Fulfillment</h1><p className="text-gray-500">Confirm quantities, allocate batches • {filteredOrders.length} orders</p></div><select className="input-field w-40 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option>All Status</option><option>Pending Confirmation</option><option>Allocated</option><option>Ready to Dispatch</option><option>Dispatched</option></select></div>

      <div className="card"><input type="text" placeholder="Search orders..." className="input-field w-full max-w-md" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-3"><h3 className="font-bold text-gray-900">Orders</h3>{filteredOrders.map((order) => (<div key={order.id} onClick={() => setSelectedOrder(order.id)} className={`card cursor-pointer transition-all ${selectedOrder === order.id ? 'ring-2 ring-primary-500' : ''}`}><div className="flex items-center justify-between mb-2"><span className="font-medium text-gray-900 text-sm">{order.id}</span><span className={`px-2 py-0.5 rounded text-xs font-medium ${order.status === 'Pending Confirmation' ? 'bg-yellow-100 text-yellow-700' : order.status === 'Allocated' ? 'bg-blue-100 text-blue-700' : order.status === 'Ready to Dispatch' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>{order.status}</span></div><div className="text-xs text-gray-500">{order.outlet}</div><div className="flex items-center justify-between mt-2"><span className="text-sm font-medium">₹{order.amount.toLocaleString()}</span><span className="text-xs text-gray-400">{order.items} items</span></div></div>))}</div>

        <div className="lg:col-span-2">{selectedOrder ? (<div className="space-y="><div className="card"><div className="flex items-center justify-between mb-4"><div><h3 className="font-bold text-gray-900">{selectedOrder}</h3><p className="text-sm text-gray-500">{orders.find(o => o.id === selectedOrder)?.outlet}</p></div><span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">Pending Confirmation</span></div><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-gray-50"><tr className="text-left text-gray-500"><th className="px-4 py-2 font-medium">Product</th><th className="px-4 py-2 font-medium">Ordered</th><th className="px-4 py-2 font-medium">Confirmed</th><th className="px-4 py-2 font-medium">Batch (FEFO)</th></tr></thead><tbody>{[{ sku: 'SKU-001', name: 'Surf Excel 1kg', ordered: 10, confirmed: 10 }, { sku: 'SKU-002', name: 'Colgate Max Fresh', ordered: 20, confirmed: 18 }].map((item) => (<tr key={item.sku} className="border-t border-gray-100"><td className="px-4 py-3"><div className="font-medium text-gray-900">{item.name}</div><div className="text-xs text-gray-400">{item.sku}</div></td><td className="px-4 py-3">{item.ordered}</td><td className="px-4 py-3"><input type="number" defaultValue={item.confirmed} className="w-16 px-2 py-1 border rounded text-center" /></td><td className="px-4 py-3"><select className="input-field text-xs py-1"><option>Auto (FEFO)</option><option>B20260315</option></select></td></tr>))}</tbody></table></div><div className="flex justify-between mt-4 pt-4 border-t border-gray-100"><button className="btn-secondary text-sm">Reject</button><button onClick={() => handleConfirm(selectedOrder)} className="btn-primary text-sm">Confirm & Allocate</button></div></div><div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-4"><h4 className="font-medium text-blue-800 mb-2">FEFO Allocation</h4><p className="text-sm text-blue-700">Batches are automatically allocated using First-Expired-First-Out.</p></div></div>) : (<div className="card flex items-center justify-center h-64"><div className="text-center"><div className="text-4xl mb-4">📋</div><p className="text-gray-500">Select an order to view details</p></div></div>)}</div>
      </div>
    </div>
  );
}
