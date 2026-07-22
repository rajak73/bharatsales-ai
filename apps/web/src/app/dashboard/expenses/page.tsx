'use client';

import { useState, useEffect } from 'react';
import { ExpensesService } from '@bharatsales/api-client';
import { Expense } from '@bharatsales/shared-types';
import { Loader2 } from 'lucide-react';

export default function ExpensesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [successMessage, setSuccessMessage] = useState('');
  
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const data = await ExpensesService.getExpenses();
      setExpenses(data || []);
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredExpenses = expenses.filter(e => {
    const matchesSearch = e.repName?.toLowerCase().includes(searchTerm.toLowerCase()) || e.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All Status' || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleApprove = async (id: string) => {
    try {
      await ExpensesService.updateExpenseStatus(id, 'Approved');
      setSuccessMessage(`Expense ${id} approved!`);
      fetchExpenses();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error(error);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await ExpensesService.updateExpenseStatus(id, 'Rejected');
      setSuccessMessage(`Expense ${id} rejected.`);
      fetchExpenses();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error(error);
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
        <div><h1 className="text-2xl font-bold text-gray-900">Expenses</h1><p className="text-gray-500">Team expense claims • {filteredExpenses.length} claims</p></div>
        <button className="btn-primary text-sm">+ Add Expense</button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="card text-center"><div className="text-2xl font-bold text-gray-900">₹{expenses.reduce((s, e) => s + e.amount, 0).toLocaleString()}</div><div className="text-sm text-gray-500">Total</div></div>
        <div className="card text-center"><div className="text-2xl font-bold text-green-600">₹{expenses.filter(e => e.status === 'Approved').reduce((s, e) => s + e.amount, 0).toLocaleString()}</div><div className="text-sm text-gray-500">Approved</div></div>
        <div className="card text-center"><div className="text-2xl font-bold text-yellow-600">₹{expenses.filter(e => e.status === 'Pending').reduce((s, e) => s + e.amount, 0).toLocaleString()}</div><div className="text-sm text-gray-500">Pending</div></div>
        <div className="card text-center"><div className="text-2xl font-bold text-red-600">₹{expenses.filter(e => e.status === 'Rejected').reduce((s, e) => s + e.amount, 0).toLocaleString()}</div><div className="text-sm text-gray-500">Rejected</div></div>
      </div>

      <div className="card">
        <div className="flex flex-wrap gap-4">
          <input type="text" placeholder="Search expenses..." className="input-field w-64" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          <select className="input-field w-40" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option>All Status</option><option>Approved</option><option>Pending</option><option>Rejected</option></select>
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50"><tr className="text-left text-gray-500"><th className="px-6 py-3 font-medium">ID</th><th className="px-6 py-3 font-medium">Date</th><th className="px-6 py-3 font-medium">Rep</th><th className="px-6 py-3 font-medium">Type</th><th className="px-6 py-3 font-medium">Amount</th><th className="px-6 py-3 font-medium">Status</th><th className="px-6 py-3 font-medium">Actions</th></tr></thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></td>
                </tr>
              ) : filteredExpenses.length > 0 ? (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="border-t border-gray-100">
                    <td className="px-6 py-3 font-medium text-primary-600">{exp.id}</td>
                    <td className="px-6 py-3 text-gray-600">{new Date(exp.date).toLocaleDateString()}</td>
                    <td className="px-6 py-3 text-gray-900">{exp.repName}</td>
                    <td className="px-6 py-3 text-gray-600">{exp.type}</td>
                    <td className="px-6 py-3 font-medium">₹{exp.amount}</td>
                    <td className="px-6 py-3"><span className={`px-2.5 py-1 rounded-full text-xs font-medium ${exp.status === 'Approved' ? 'bg-green-100 text-green-700' : exp.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{exp.status}</span></td>
                    <td className="px-6 py-3">
                      {exp.status === 'Pending' && (
                        <div className="flex space-x-2">
                          <button onClick={() => handleApprove(exp.id)} className="text-green-600 text-xs font-medium hover:text-green-700">Approve</button>
                          <button onClick={() => handleReject(exp.id)} className="text-red-600 text-xs font-medium hover:text-red-700">Reject</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">No expenses found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
