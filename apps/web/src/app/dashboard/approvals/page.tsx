'use client';

import { useState, useEffect } from 'react';
import { ApprovalsService } from '@bharatsales/api-client';
import { Approval, ApprovalRule } from '@bharatsales/shared-types';
import { Loader2 } from 'lucide-react';

export default function ApprovalsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [successMessage, setSuccessMessage] = useState('');
  
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [approvalRules, setApprovalRules] = useState<ApprovalRule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [approvalsData, rulesData] = await Promise.all([
        ApprovalsService.getApprovals(),
        ApprovalsService.getApprovalRules()
      ]);
      setApprovals(approvalsData || []);
      setApprovalRules(rulesData || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter approvals
  const filteredApprovals = approvals.filter(approval => {
    const matchesSearch = approval.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          approval.outlet.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          approval.order.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'All Types' || approval.type.includes(typeFilter);
    return matchesSearch && matchesType;
  });

  const pendingApprovals = filteredApprovals.filter(a => a.status === 'Pending');
  const totalPendingValue = pendingApprovals.reduce((sum, a) => sum + a.amount, 0);

  const handleApprove = (id: string) => {
    setApprovals(approvals.map(a => a.id === id ? { ...a, status: 'Approved' } : a));
    setSuccessMessage(`Approval ${id} has been approved!`);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleReject = (id: string) => {
    setApprovals(approvals.map(a => a.id === id ? { ...a, status: 'Rejected' } : a));
    setSuccessMessage(`Approval ${id} has been rejected.`);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const formatCurrency = (amount: number) => {
    return '₹' + amount.toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-green-600">✅</span>
            <span className="text-sm text-green-800 font-medium">{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage('')} className="text-green-600 hover:text-green-800">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Approval Centre</h1>
          <p className="text-gray-500">Review and approve pending requests • {pendingApprovals.length} pending</p>
        </div>
        <div className="flex space-x-3">
          <select
            className="input-field w-40 text-sm"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option>All Types</option>
            <option>Credit Limit</option>
            <option>Discount</option>
            <option>Overdue</option>
            <option>Price</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card text-center">
          <div className="text-2xl font-bold text-yellow-600">{pendingApprovals.length}</div>
          <div className="text-sm text-gray-500">Pending</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-600">{approvals.filter(a => a.status === 'Approved').length}</div>
          <div className="text-sm text-gray-500">Approved</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-red-600">{approvals.filter(a => a.status === 'Rejected').length}</div>
          <div className="text-sm text-gray-500">Rejected</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-primary-600">{formatCurrency(totalPendingValue)}</div>
          <div className="text-sm text-gray-500">Total Pending Value</div>
        </div>
      </div>

      {/* Search */}
      <div className="card">
        <input
          type="text"
          placeholder="Search by ID, outlet, order..."
          className="input-field w-full max-w-md"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Pending Approvals */}
      <div className="card overflow-hidden p-0">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">Pending Approvals</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
          ) : pendingApprovals.length > 0 ? (
            pendingApprovals.map((approval) => (
              <div key={approval.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        approval.priority === 'High' ? 'bg-red-100 text-red-700' :
                        approval.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {approval.priority}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">{approval.type}</span>
                      <span className="text-sm font-medium text-primary-600">{approval.id}</span>
                    </div>
                    <div className="text-sm text-gray-900 font-medium">{approval.outlet} • {approval.order}</div>
                    <div className="text-sm text-gray-500 mt-1">{approval.reason}</div>
                    <div className="text-xs text-gray-400 mt-2">By {approval.requestedBy} • {approval.date}</div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">{formatCurrency(approval.amount)}</div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleApprove(approval.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(approval.id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-gray-400">
              <div className="text-4xl mb-2">✅</div>
              <p className="text-sm">No pending approvals!</p>
              <p className="text-xs mt-1">All approvals have been processed.</p>
            </div>
          )}
        </div>
      </div>

      {/* Approval Rules */}
      <div className="card">
        <h3 className="font-bold text-gray-900 mb-4">Approval Rules Configuration</h3>
        <div className="space-y-3">
          {approvalRules.map((rule) => (
            <div key={rule.trigger} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="text-sm font-medium text-gray-900">{rule.trigger}</div>
                <div className="text-xs text-gray-500">Approver: {rule.approver}</div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`w-3 h-3 rounded-full ${rule.enabled ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                <span className="text-xs text-gray-500">{rule.enabled ? 'Enabled' : 'Disabled'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
