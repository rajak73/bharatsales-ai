'use client';

import { useState } from 'react';

export default function DistributorReturnsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [successMessage, setSuccessMessage] = useState('');

  const [returns, setReturns] = useState([
    { id: 'RET-001', date: '14 Jul 2026', outlet: 'Sharma General Store', product: 'Surf Excel 1kg', batch: 'B20260115', qty: 5, reason: 'Expiry', status: 'Pending', claimAmount: 800 },
    { id: 'RET-002', date: '13 Jul 2026', outlet: 'Patel Medical Hall', product: 'Colgate Max Fresh', batch: 'B20260201', qty: 3, reason: 'Quality', status: 'Approved', claimAmount: 246 },
    { id: 'RET-003', date: '12 Jul 2026', outlet: 'Gupta Kirana', product: 'Parle-G 200g', batch: 'B20260310', qty: 10, reason: 'Commercial', status: 'Processed', claimAmount: 170 },
    { id: 'RET-004', date: '11 Jul 2026', outlet: 'Singh Electronics', product: 'Dettol Soap 70g', batch: 'B20260201', qty: 8, reason: 'Delivery', status: 'Rejected', claimAmount: 304 },
  ]);

  const claims = [
    { id: 'CLM-001', returnId: 'RET-001', amount: 800, status: 'Pending', type: 'Commercial', funding: 'Company' },
    { id: 'CLM-002', returnId: 'RET-002', amount: 246, status: 'Approved', type: 'Quality', funding: 'Distributor' },
    { id: 'CLM-003', returnId: 'RET-003', amount: 170, status: 'Settled', type: 'Commercial', funding: 'Company' },
  ];

  const filteredReturns = returns.filter(r => {
    const matchesSearch = r.outlet.toLowerCase().includes(searchTerm.toLowerCase()) || r.product.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All Status' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleApprove = (id: string) => {
    setReturns(returns.map(r => r.id === id ? { ...r, status: 'Approved' } : r));
    setSuccessMessage(`Return ${id} approved!`);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleReject = (id: string) => {
    setReturns(returns.map(r => r.id === id ? { ...r, status: 'Rejected' } : r));
    setSuccessMessage(`Return ${id} rejected.`);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  return (
    <div className="space-y-6">
      {successMessage && (<div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between"><div className="flex items-center space-x-2"><span className="text-green-600">✅</span><span className="text-sm text-green-800 font-medium">{successMessage}</span></div><button onClick={() => setSuccessMessage('')} className="text-green-600 hover:text-green-800">✕</button></div>)}

      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-gray-900">Returns & Claims</h1><p className="text-gray-500">Process returns and track claims • {filteredReturns.length} returns</p></div><button className="btn-primary text-sm">+ New Return</button></div>

      <div className="grid grid-cols-4 gap-4">
        <div className="card text-center"><div className="text-2xl font-bold text-gray-900">{returns.length}</div><div className="text-sm text-gray-500">Total Returns</div></div>
        <div className="card text-center"><div className="text-2xl font-bold text-yellow-600">{returns.filter(r => r.status === 'Pending').length}</div><div className="text-sm text-gray-500">Pending</div></div>
        <div className="card text-center"><div className="text-2xl font-bold text-green-600">₹{returns.reduce((s, r) => s + r.claimAmount, 0)}</div><div className="text-sm text-gray-500">Claim Amount</div></div>
        <div className="card text-center"><div className="text-2xl font-bold text-primary-600">{claims.length}</div><div className="text-sm text-gray-500">Claims Filed</div></div>
      </div>

      <div className="card"><div className="flex flex-wrap gap-4"><input type="text" placeholder="Search returns..." className="input-field w-64" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /><select className="input-field w-40" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option>All Status</option><option>Pending</option><option>Approved</option><option>Processed</option><option>Rejected</option></select></div></div>

      <div className="card overflow-hidden p-0"><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-gray-50"><tr className="text-left text-gray-500"><th className="px-6 py-3 font-medium">ID</th><th className="px-6 py-3 font-medium">Date</th><th className="px-6 py-3 font-medium">Outlet</th><th className="px-6 py-3 font-medium">Product</th><th className="px-6 py-3 font-medium">Qty</th><th className="px-6 py-3 font-medium">Reason</th><th className="px-6 py-3 font-medium">Amount</th><th className="px-6 py-3 font-medium">Status</th><th className="px-6 py-3 font-medium">Actions</th></tr></thead><tbody>{filteredReturns.map((ret) => (<tr key={ret.id} className="border-t border-gray-100"><td className="px-6 py-3 font-medium text-primary-600">{ret.id}</td><td className="px-6 py-3 text-gray-600">{ret.date}</td><td className="px-6 py-3 text-gray-900">{ret.outlet}</td><td className="px-6 py-3 text-gray-900">{ret.product}</td><td className="px-6 py-3 text-gray-600">{ret.qty}</td><td className="px-6 py-3"><span className={`px-2 py-1 rounded text-xs font-medium ${ret.reason === 'Expiry' ? 'bg-red-100 text-red-700' : ret.reason === 'Quality' ? 'bg-yellow-100 text-yellow-700' : ret.reason === 'Commercial' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>{ret.reason}</span></td><td className="px-6 py-3 font-medium">₹{ret.claimAmount}</td><td className="px-6 py-3"><span className={`px-2.5 py-1 rounded-full text-xs font-medium ${ret.status === 'Approved' || ret.status === 'Processed' ? 'bg-green-100 text-green-700' : ret.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{ret.status}</span></td><td className="px-6 py-3">{ret.status === 'Pending' && (<div className="flex space-x-2"><button onClick={() => handleApprove(ret.id)} className="text-green-600 text-xs font-medium hover:text-green-700">Approve</button><button onClick={() => handleReject(ret.id)} className="text-red-600 text-xs font-medium hover:text-red-700">Reject</button></div>)}</td></tr>))}</tbody></table></div></div>

      <div className="card overflow-hidden p-0"><div className="px-6 py-4 border-b border-gray-100"><h3 className="font-bold text-gray-900">Claims</h3></div><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-gray-50"><tr className="text-left text-gray-500"><th className="px-6 py-3 font-medium">Claim ID</th><th className="px-6 py-3 font-medium">Return ID</th><th className="px-6 py-3 font-medium">Amount</th><th className="px-6 py-3 font-medium">Type</th><th className="px-6 py-3 font-medium">Funding</th><th className="px-6 py-3 font-medium">Status</th></tr></thead><tbody>{claims.map((claim) => (<tr key={claim.id} className="border-t border-gray-100"><td className="px-6 py-3 font-medium text-primary-600">{claim.id}</td><td className="px-6 py-3 text-gray-600">{claim.returnId}</td><td className="px-6 py-3 font-medium">₹{claim.amount}</td><td className="px-6 py-3 text-gray-600">{claim.type}</td><td className="px-6 py-3 text-gray-600">{claim.funding}</td><td className="px-6 py-3"><span className={`px-2.5 py-1 rounded-full text-xs font-medium ${claim.status === 'Settled' ? 'bg-green-100 text-green-700' : claim.status === 'Approved' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>{claim.status}</span></td></tr>))}</tbody></table></div></div>
    </div>
  );
}
