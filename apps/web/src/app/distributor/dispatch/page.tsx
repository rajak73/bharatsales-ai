'use client';

import { useState } from 'react';

export default function DistributorDispatchPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [successMessage, setSuccessMessage] = useState('');
  const [dispatches, setDispatches] = useState([
    { id: 'DSP-001', order: 'ORD-2398', outlet: 'Singh Electronics', vehicle: 'KA-01-AB-1234', driver: 'Ramesh', items: 15, status: 'Packed', step: 4 },
    { id: 'DSP-002', order: 'ORD-2397', outlet: 'Mishra Traders', vehicle: 'KA-01-CD-5678', driver: 'Suresh', items: 4, status: 'Dispatched', step: 5 },
    { id: 'DSP-003', order: 'ORD-2396', outlet: 'Royal Distributors', vehicle: 'KA-01-EF-9012', driver: 'Mahesh', items: 28, status: 'In Transit', step: 6 },
    { id: 'DSP-004', order: 'ORD-2395', outlet: 'Gupta Kirana', vehicle: 'KA-01-GH-3456', driver: 'Ramesh', items: 12, status: 'Delivered', step: 7 },
  ]);

  const filteredDispatches = dispatches.filter(d => {
    const matchesSearch = d.outlet.toLowerCase().includes(searchTerm.toLowerCase()) || d.order.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All Status' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleMarkDispatched = (id: string) => {
    setDispatches(dispatches.map(d => d.id === id ? { ...d, status: 'Dispatched' } : d));
    setSuccessMessage(`Dispatch ${id} marked as dispatched!`);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleConfirmDelivery = (id: string) => {
    setDispatches(dispatches.map(d => d.id === id ? { ...d, status: 'Delivered' } : d));
    setSuccessMessage(`Delivery confirmed for ${id}!`);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  return (
    <div className="space-y-6">
      {successMessage && (<div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between"><div className="flex items-center space-x-2"><span className="text-green-600">✅</span><span className="text-sm text-green-800 font-medium">{successMessage}</span></div><button onClick={() => setSuccessMessage('')} className="text-green-600 hover:text-green-800">✕</button></div>)}

      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-gray-900">Dispatch & Delivery</h1><p className="text-gray-500">Manage packing, dispatch, and proof of delivery • {filteredDispatches.length} dispatches</p></div><select className="input-field w-40 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option>All Status</option><option>Packed</option><option>Dispatched</option><option>In Transit</option><option>Delivered</option></select></div>

      <div className="card"><h3 className="font-bold text-gray-900 mb-4">Fulfillment Flow - ORD-2398</h3><div className="flex items-center justify-between overflow-x-auto pb-2">{['Confirm', 'Allocate', 'Pick', 'Pack', 'Dispatch', 'Deliver'].map((step, idx) => (<div key={step} className="flex items-center"><div className="flex flex-col items-center"><div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${idx < 4 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>{idx < 4 ? '✓' : idx + 1}</div><span className="text-xs text-gray-600 mt-2 text-center w-20">{step}</span></div>{idx < 5 && <div className={`w-6 h-0.5 mx-1 ${idx < 4 ? 'bg-green-500' : 'bg-gray-200'}`}></div>}</div>))}</div></div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card"><h3 className="font-bold text-gray-900 mb-4">Pick List - ORD-2398</h3><div className="space-y-2">{[{ product: 'Surf Excel 1kg', batch: 'B20260315', qty: 10, picked: 10, location: 'A-1-3' }, { product: 'Colgate Max Fresh', batch: 'B20260401', qty: 18, picked: 18, location: 'B-2-1' }, { product: 'Dettol Soap 70g', batch: 'B20260201', qty: 15, picked: 12, location: 'A-2-4' }].map((item) => (<div key={item.product} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"><div><div className="text-sm font-medium text-gray-900">{item.product}</div><div className="text-xs text-gray-500">Batch: {item.batch} • Location: {item.location}</div></div><div className="text-right"><div className="text-sm font-medium">{item.picked}/{item.qty}</div><span className={`text-xs ${item.picked === item.qty ? 'text-green-600' : 'text-red-600'}`}>{item.picked === item.qty ? 'Complete' : 'Incomplete'}</span></div></div>))}</div><button className="btn-primary w-full text-sm mt-4">Validate Packing</button></div>

        <div className="space-y-4">
          <div className="card"><h3 className="font-bold text-gray-900 mb-4">Dispatch Document</h3><div className="space-y-3"><div className="grid grid-cols-2 gap-3"><div><label className="block text-xs text-gray-500 mb-1">Vehicle</label><select className="input-field text-sm py-2"><option>KA-01-AB-1234</option><option>KA-01-CD-5678</option></select></div><div><label className="block text-xs text-gray-500 mb-1">Driver</label><select className="input-field text-sm py-2"><option>Ramesh</option><option>Suresh</option></select></div></div><button onClick={() => handleMarkDispatched('DSP-001')} className="btn-primary w-full text-sm">Mark Dispatched</button></div></div>
          <div className="card"><h3 className="font-bold text-gray-900 mb-4">Proof of Delivery</h3><div className="space-y-3"><div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center"><div className="text-3xl mb-2">📷</div><p className="text-sm text-gray-500">Upload POD photo</p><button className="btn-secondary text-xs py-1 mt-2">Upload</button></div><div className="grid grid-cols-2 gap-3"><div><label className="block text-xs text-gray-500 mb-1">Received By</label><input type="text" className="input-field text-sm py-2" placeholder="Recipient name" /></div><div><label className="block text-xs text-gray-500 mb-1">Delivery Time</label><input type="time" className="input-field text-sm py-2" /></div></div><button onClick={() => handleConfirmDelivery('DSP-001')} className="btn-primary w-full text-sm">Confirm Delivery</button></div></div>
        </div>
      </div>

      <div className="card overflow-hidden p-0"><div className="px-6 py-4 border-b border-gray-100"><h3 className="font-bold text-gray-900">Dispatch Records</h3></div><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-gray-50"><tr className="text-left text-gray-500"><th className="px-6 py-3 font-medium">Dispatch ID</th><th className="px-6 py-3 font-medium">Order</th><th className="px-6 py-3 font-medium">Outlet</th><th className="px-6 py-3 font-medium">Vehicle</th><th className="px-6 py-3 font-medium">Driver</th><th className="px-6 py-3 font-medium">Status</th></tr></thead><tbody>{filteredDispatches.map((d) => (<tr key={d.id} className="border-t border-gray-100"><td className="px-6 py-3 font-medium text-primary-600">{d.id}</td><td className="px-6 py-3 text-gray-600">{d.order}</td><td className="px-6 py-3 text-gray-900">{d.outlet}</td><td className="px-6 py-3 text-gray-600">{d.vehicle}</td><td className="px-6 py-3 text-gray-600">{d.driver}</td><td className="px-6 py-3"><span className={`px-2 py-1 rounded text-xs font-medium ${d.status === 'Delivered' ? 'bg-green-100 text-green-700' : d.status === 'In Transit' ? 'bg-blue-100 text-blue-700' : d.status === 'Dispatched' ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'}`}>{d.status}</span></td></tr>))}</tbody></table></div></div>
    </div>
  );
}
