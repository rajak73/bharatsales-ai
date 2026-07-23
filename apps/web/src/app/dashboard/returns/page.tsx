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
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Return Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newReturn, setNewReturn] = useState({
    outlet: '',
    reason: 'Quality',
    items: [{ product: '', qty: 1 }],
    value: ''
  });

  useEffect(() => {
    const fetchReturns = async () => {
      try {
        const data = await ReturnsService.getReturns();
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

  const handleCreateReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReturn.outlet || !newReturn.items[0].product) {
      alert('Outlet and Product are required.');
      return;
    }
    
    try {
      setIsSubmitting(true);
      // Construct payload according to shared-types (using basic defaults for missing fields)
      const payload: Partial<ReturnOrder> = {
        outlet: newReturn.outlet,
        reason: newReturn.reason as any,
        status: 'Pending Approval', // Default status
        items: newReturn.items,
        value: newReturn.value || '0',
        createdAt: new Date().toISOString()
      };
      
      const created = await ReturnsService.createReturn(payload);
      setReturns([created, ...returns]);
      setSuccessMessage('Return created successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      setIsModalOpen(false);
      setNewReturn({ outlet: '', reason: 'Quality', items: [{ product: '', qty: 1 }], value: '' });
    } catch (error) {
      console.error('Failed to create return:', error);
      alert('Failed to create return.');
    } finally {
      setIsSubmitting(false);
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
        <button onClick={() => setIsModalOpen(true)} className="btn-primary text-sm">+ New Return</button>
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
                const product = ret.items?.[0]?.product || 'Unknown Product';
                const qty = ret.items?.reduce((sum, item) => sum + item.qty, 0) || 0;
                
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

      {/* New Return Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Create New Return</h3>
            <form onSubmit={handleCreateReturn} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Outlet ID / Name</label>
                <input
                  type="text"
                  required
                  className="input-field w-full"
                  placeholder="e.g. OUT-001"
                  value={newReturn.outlet}
                  onChange={(e) => setNewReturn({ ...newReturn, outlet: e.target.value })}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                  <input
                    type="text"
                    required
                    className="input-field w-full"
                    placeholder="Product ID"
                    value={newReturn.items[0].product}
                    onChange={(e) => setNewReturn({ ...newReturn, items: [{ ...newReturn.items[0], product: e.target.value }] })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    required
                    min="1"
                    className="input-field w-full"
                    value={newReturn.items[0].qty}
                    onChange={(e) => setNewReturn({ ...newReturn, items: [{ ...newReturn.items[0], qty: Number(e.target.value) }] })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                  <select
                    className="input-field w-full"
                    value={newReturn.reason}
                    onChange={(e) => setNewReturn({ ...newReturn, reason: e.target.value })}
                  >
                    <option value="Quality">Quality / Damage</option>
                    <option value="Expiry">Expiry</option>
                    <option value="Commercial">Commercial / Unsold</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Claim Value (₹)</label>
                  <input
                    type="number"
                    className="input-field w-full"
                    placeholder="0.00"
                    value={newReturn.value}
                    onChange={(e) => setNewReturn({ ...newReturn, value: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 btn-secondary text-sm">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 btn-primary text-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Return'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
