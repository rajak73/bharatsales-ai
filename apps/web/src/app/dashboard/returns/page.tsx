'use client';

import { useState, useEffect } from 'react';
import { ReturnsService } from '@bharatsales/api-client';
import { ReturnOrder } from '@bharatsales/shared-types';

export default function ReturnsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [successMessage, setSuccessMessage] = useState('');
  const [returns, setReturns] = useState<ReturnOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const organizationId = 'org-123';

  useEffect(() => {
    const fetchReturns = async () => {
      try {
        const data = await ReturnsService.getReturns(organizationId);
        setReturns(data);
      } catch (error) {
        console.error('Failed to fetch returns', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReturns();
  }, []);

  const filteredReturns = returns.filter(r => {
    const matchesSearch = (r.outlet || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All Status' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleApprove = async (id: string) => {
    try {
      await ReturnsService.updateReturnStatus(id, 'Approved');
      setReturns(returns.map(r => r.id === id ? { ...r, status: 'Approved' } : r));
      setSuccessMessage(`Return ${id} approved!`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Failed to approve return', error);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await ReturnsService.updateReturnStatus(id, 'Rejected');
      setReturns(returns.map(r => r.id === id ? { ...r, status: 'Rejected' } : r));
      setSuccessMessage(`Return ${id} rejected.`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Failed to reject return', error);
    }
  };

  return (
    <div className="space-y-6">
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2"><span className="text-green-600">✅</span><span className="text-sm text-green-800 font-medium">{successMessage}</span></div>
          <button onClick={() => setSuccessMessage('')} className="text-green-600 hover:text-green-800">✕</button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Returns & Claims</h1><p className="text-gray-500">Process returns and track claims • {filteredReturns.length} returns</p></div>
        <button className="btn-primary text-sm">+ New Return</button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="card text-center"><div className="text-2xl font-bold text-gray-900">{returns.length}</div><div className="text-sm text-gray-500">Total Returns</div></div>
        <div className="card text-center"><div className="text-2xl font-bold text-yellow-600">{returns.filter(r => r.status === 'Pending Approval').length}</div><div className="text-sm text-gray-500">Pending</div></div>
        <div className="card text-center"><div className="text-2xl font-bold text-green-600">₹{returns.reduce((s, r) => s + parseFloat(r.value || '0'), 0)}</div><div className="text-sm text-gray-500">Claim Amount</div></div>
        <div className="card text-center"><div className="text-2xl font-bold text-primary-600">{returns.filter(r => r.status === 'Processed').length}</div><div className="text-sm text-gray-500">Processed</div></div>
      </div>

      <div className="card">
        <div className="flex flex-wrap gap-4">
          <input type="text" placeholder="Search returns..." className="input-field w-64" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          <select className="input-field w-40" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option>All Status</option><option>Pending</option><option>Approved</option><option>Processed</option><option>Rejected</option></select>
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50"><tr className="text-left text-gray-500"><th className="px-6 py-3 font-medium">ID</th><th className="px-6 py-3 font-medium">Date</th><th className="px-6 py-3 font-medium">Outlet</th><th className="px-6 py-3 font-medium">Product</th><th className="px-6 py-3 font-medium">Qty</th><th className="px-6 py-3 font-medium">Reason</th><th className="px-6 py-3 font-medium">Amount</th><th className="px-6 py-3 font-medium">Status</th><th className="px-6 py-3 font-medium">Actions</th></tr></thead>
            <tbody>
              {filteredReturns.map((ret) => {
                const date = ret.createdAt ? new Date(ret.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Unknown Date';
                const product = 'Mock Product'; // Product info missing from schema currently
                const qty = 1; // qty missing
                
                return (
                  <tr key={ret.id} className="border-t border-gray-100">
                    <td className="px-6 py-3 font-medium text-primary-600">{ret.id.substring(0, 8)}</td>
                    <td className="px-6 py-3 text-gray-600">{date}</td>
                    <td className="px-6 py-3 text-gray-900">{ret.outlet}</td>
                    <td className="px-6 py-3 text-gray-900">{product}</td>
                    <td className="px-6 py-3 text-gray-600">{qty}</td>
                    <td className="px-6 py-3"><span className={`px-2 py-1 rounded text-xs font-medium ${ret.reason === 'Expiry' ? 'bg-red-100 text-red-700' : ret.reason === 'Quality' ? 'bg-yellow-100 text-yellow-700' : ret.reason === 'Commercial' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>{ret.reason}</span></td>
                    <td className="px-6 py-3 font-medium">₹{ret.value}</td>
                    <td className="px-6 py-3"><span className={`px-2.5 py-1 rounded-full text-xs font-medium ${ret.status === 'Approved' || ret.status === 'Processed' ? 'bg-green-100 text-green-700' : ret.status === 'Pending Approval' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{ret.status}</span></td>
                    <td className="px-6 py-3">
                      {ret.status === 'Pending Approval' && (
                        <div className="flex space-x-2">
                          <button onClick={() => handleApprove(ret.id)} className="text-green-600 text-xs font-medium hover:text-green-700">Approve</button>
                          <button onClick={() => handleReject(ret.id)} className="text-red-600 text-xs font-medium hover:text-red-700">Reject</button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
