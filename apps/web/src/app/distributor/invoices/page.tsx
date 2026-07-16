'use client';

import { useState } from 'react';

export default function DistributorInvoicesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [successMessage, setSuccessMessage] = useState('');

  const invoices = [
    { id: 'INV-1001', order: 'ORD-2396', outlet: 'Royal Distributors', amount: 45000, date: '13 Jul 2026', dueDate: '28 Jul 2026', status: 'Paid', paidAmount: 45000 },
    { id: 'INV-1002', order: 'ORD-2395', outlet: 'Gupta Kirana', amount: 15200, date: '13 Jul 2026', dueDate: '28 Jul 2026', status: 'Pending', paidAmount: 0 },
    { id: 'INV-1003', order: 'ORD-2394', outlet: 'City Medical', amount: 18500, date: '12 Jul 2026', dueDate: '27 Jul 2026', status: 'Partial', paidAmount: 10000 },
    { id: 'INV-1004', order: 'ORD-2393', outlet: 'Mishra Traders', amount: 6800, date: '11 Jul 2026', dueDate: '26 Jul 2026', status: 'Overdue', paidAmount: 0 },
    { id: 'INV-1005', order: 'ORD-2392', outlet: 'Singh Electronics', amount: 22100, date: '10 Jul 2026', dueDate: '25 Jul 2026', status: 'Paid', paidAmount: 22100 },
  ];

  const ageingBuckets = [
    { bucket: 'Current', amount: 15200, count: 1, color: 'bg-green-500' },
    { bucket: '1-30 days', amount: 18500, count: 1, color: 'bg-yellow-500' },
    { bucket: '31-60 days', amount: 6800, count: 1, color: 'bg-orange-500' },
    { bucket: '61-90 days', amount: 0, count: 0, color: 'bg-red-500' },
    { bucket: '90+ days', amount: 0, count: 0, color: 'bg-red-700' },
  ];

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.outlet.toLowerCase().includes(searchTerm.toLowerCase()) || inv.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All Status' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateInvoice = () => {
    setSuccessMessage('Invoice created successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  return (
    <div className="space-y-6">
      {successMessage && (<div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between"><div className="flex items-center space-x-2"><span className="text-green-600">✅</span><span className="text-sm text-green-800 font-medium">{successMessage}</span></div><button onClick={() => setSuccessMessage('')} className="text-green-600 hover:text-green-800">✕</button></div>)}

      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-gray-900">Invoices & Outstanding</h1><p className="text-gray-500">Track invoices, payments, and ageing • {filteredInvoices.length} invoices</p></div><button onClick={handleCreateInvoice} className="btn-primary text-sm">+ Create Invoice</button></div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card text-center"><div className="text-2xl font-bold text-gray-900">₹{invoices.reduce((s, i) => s + i.amount, 0).toLocaleString()}</div><div className="text-sm text-gray-500">Total Invoiced</div></div>
        <div className="card text-center"><div className="text-2xl font-bold text-green-600">₹{invoices.reduce((s, i) => s + i.paidAmount, 0).toLocaleString()}</div><div className="text-sm text-gray-500">Collected</div></div>
        <div className="card text-center"><div className="text-2xl font-bold text-yellow-600">₹{invoices.reduce((s, i) => s + (i.amount - i.paidAmount), 0).toLocaleString()}</div><div className="text-sm text-gray-500">Outstanding</div></div>
      </div>

      <div className="card"><h3 className="font-bold text-gray-900 mb-4">Ageing Analysis</h3><div className="space-y-3">{ageingBuckets.map((bucket) => (<div key={bucket.bucket} className="flex items-center space-x-4"><div className="w-24 text-sm text-gray-600">{bucket.bucket}</div><div className="flex-1"><div className="w-full bg-gray-100 rounded-full h-6 relative overflow-hidden"><div className={`h-full ${bucket.color} rounded-full flex items-center pl-3`} style={{width: '100%'}}><span className="text-white text-xs font-medium">₹{bucket.amount.toLocaleString()}</span></div></div></div><div className="w-16 text-right text-sm text-gray-500">{bucket.count} bills</div></div>))}</div></div>

      <div className="card"><div className="flex flex-wrap gap-4"><input type="text" placeholder="Search invoices..." className="input-field w-64" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /><select className="input-field w-40" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option>All Status</option><option>Paid</option><option>Pending</option><option>Partial</option><option>Overdue</option></select></div></div>

      <div className="card overflow-hidden p-0"><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-gray-50"><tr className="text-left text-gray-500"><th className="px-6 py-3 font-medium">Invoice</th><th className="px-6 py-3 font-medium">Order</th><th className="px-6 py-3 font-medium">Outlet</th><th className="px-6 py-3 font-medium">Amount</th><th className="px-6 py-3 font-medium">Due Date</th><th className="px-6 py-3 font-medium">Paid</th><th className="px-6 py-3 font-medium">Status</th></tr></thead><tbody>{filteredInvoices.map((inv) => (<tr key={inv.id} className="border-t border-gray-100"><td className="px-6 py-3 font-medium text-primary-600">{inv.id}</td><td className="px-6 py-3 text-gray-600">{inv.order}</td><td className="px-6 py-3 text-gray-900">{inv.outlet}</td><td className="px-6 py-3 font-medium">₹{inv.amount.toLocaleString()}</td><td className="px-6 py-3 text-gray-500">{inv.dueDate}</td><td className="px-6 py-3 text-green-600">₹{inv.paidAmount.toLocaleString()}</td><td className="px-6 py-3"><span className={`px-2.5 py-1 rounded-full text-xs font-medium ${inv.status === 'Paid' ? 'bg-green-100 text-green-700' : inv.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : inv.status === 'Partial' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>{inv.status}</span></td></tr>))}</tbody></table></div></div>
    </div>
  );
}
