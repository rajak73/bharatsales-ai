'use client';

import { useState, useEffect } from 'react';
import { FileText, Search, CreditCard, ChevronRight, Loader2 } from 'lucide-react';
import { Invoice } from '@bharatsales/shared-types';
import { InvoicesService } from '@bharatsales/api-client';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const data = await InvoicesService.getInvoices('org-1');
      setInvoices(data || []);
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'bg-green-100 text-green-800';
      case 'Partial': return 'bg-yellow-100 text-yellow-800';
      case 'Overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800'; // Unpaid
    }
  };

  const filteredInvoices = invoices.filter(inv => 
    inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.outletId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-500">Manage billing and track outstanding payments.</p>
        </div>
        <div className="flex space-x-3">
          <button className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">
            Generate Invoice
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-center">
          <div className="text-2xl font-bold text-gray-900">₹{invoices.reduce((sum, inv) => sum + inv.totalAmount, 0).toLocaleString()}</div>
          <div className="text-sm text-gray-500">Total Billed</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-center">
          <div className="text-2xl font-bold text-green-600">₹{invoices.reduce((sum, inv) => sum + inv.paidAmount, 0).toLocaleString()}</div>
          <div className="text-sm text-gray-500">Total Collected</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-center">
          <div className="text-2xl font-bold text-red-600">₹{invoices.reduce((sum, inv) => sum + (inv.totalAmount - inv.paidAmount), 0).toLocaleString()}</div>
          <div className="text-sm text-gray-500">Total Outstanding</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-center">
          <div className="text-2xl font-bold text-orange-600">{invoices.filter(i => i.status === 'Overdue' || new Date(i.dueDate) < new Date()).length}</div>
          <div className="text-sm text-gray-500">Overdue Invoices</div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by Invoice # or Outlet ID..."
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
                <th className="px-6 py-4 font-medium">Invoice #</th>
                <th className="px-6 py-4 font-medium">Outlet</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Due Date</th>
                <th className="px-6 py-4 font-medium text-right">Total Amount</th>
                <th className="px-6 py-4 font-medium text-right">Balance Due</th>
                <th className="px-6 py-4 font-medium text-center">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                 <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">Loading invoices...</td>
                </tr>
              ) : filteredInvoices.length > 0 ? (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer">
                    <td className="px-6 py-4 font-medium text-primary-600 flex items-center">
                      <FileText className="w-4 h-4 mr-2 text-gray-400" />
                      {inv.invoiceNumber}
                    </td>
                    <td className="px-6 py-4 text-gray-900 font-medium">{inv.outletId}</td>
                    <td className="px-6 py-4 text-gray-600">{new Date(inv.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-gray-600">
                      <span className={new Date(inv.dueDate) < new Date() && inv.status !== 'Paid' ? 'text-red-600 font-medium' : ''}>
                        {new Date(inv.dueDate).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900 text-right">₹{inv.totalAmount.toLocaleString()}</td>
                    <td className="px-6 py-4 font-bold text-gray-900 text-right">₹{(inv.totalAmount - inv.paidAmount).toLocaleString()}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(inv.status)}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-gray-400 hover:text-primary-600">
                        <ChevronRight className="w-5 h-5 ml-auto" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="text-gray-400 flex flex-col items-center">
                      <div className="bg-gray-50 p-3 rounded-full mb-3">
                        <CreditCard className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-sm font-medium text-gray-900 mb-1">No invoices found</h3>
                      <p className="text-sm text-gray-500">Generate an invoice from an approved order.</p>
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
