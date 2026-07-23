'use client';

import { useState, useEffect } from 'react';
import { IndianRupee, Search, ChevronRight, CheckCircle2 } from 'lucide-react';
import { PaymentCollection, Outlet, Invoice } from '@bharatsales/shared-types';
import { CollectionsService, OutletsService, InvoicesService } from '@bharatsales/api-client';

export default function CollectionsPage() {
  const [collections, setCollections] = useState<PaymentCollection[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [newPayment, setNewPayment] = useState({
    outletId: '',
    invoiceId: '',
    amount: '',
    paymentMode: 'Cash' as any,
    referenceNumber: ''
  });

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      const [colData, outData, invData] = await Promise.all([
        CollectionsService.getCollections(),
        OutletsService.getOutlets(),
        InvoicesService.getInvoices()
      ]);
      setCollections(colData || []);
      setOutlets(outData || []);
      setInvoices(invData || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPayment.outletId || !newPayment.amount) {
      alert('Outlet and Amount are required.');
      return;
    }
    
    try {
      await CollectionsService.createCollection({
        outletId: newPayment.outletId,
        invoiceId: newPayment.invoiceId || undefined,
        amount: parseFloat(newPayment.amount),
        paymentMode: newPayment.paymentMode,
        referenceNumber: newPayment.referenceNumber || undefined,
        receiptNumber: `REC-${Date.now()}`,
        status: 'Cleared', // auto-settle since admin is entering it
        collectionDate: new Date().toISOString()
      });
      
      setShowModal(false);
      setNewPayment({ outletId: '', invoiceId: '', amount: '', paymentMode: 'Cash', referenceNumber: '' });
      await fetchCollections();
    } catch (error) {
      console.error('Failed to record payment', error);
      alert('Failed to record payment.');
    }
  };

  const handleVerify = async (id: string) => {
    try {
      await CollectionsService.updateCollectionStatus(id, 'Verified');
      setCollections(collections.map(c => c.id === id ? { ...c, status: 'Verified' } : c));
    } catch (error) {
      console.error('Failed to verify collection', error);
      alert('Failed to verify collection.');
    }
  };

  const handleReverse = async (id: string) => {
    if (!confirm('Are you sure you want to reverse this collection? This will recreate the outstanding balance.')) return;
    try {
      await CollectionsService.updateCollectionStatus(id, 'Reversed');
      setCollections(collections.map(c => c.id === id ? { ...c, status: 'Reversed' } : c));
    } catch (error) {
      console.error('Failed to reverse collection', error);
      alert('Failed to reverse collection.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Collections</h1>
          <p className="text-gray-500">Track incoming payments from field representatives.</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700"
          >
            Record Payment
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-gray-500">
                <th className="px-6 py-4 font-medium">Receipt #</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Outlet</th>
                <th className="px-6 py-4 font-medium">Mode</th>
                <th className="px-6 py-4 font-medium">Ref Number</th>
                <th className="px-6 py-4 font-medium text-right">Amount</th>
                <th className="px-6 py-4 font-medium text-center">Status</th>
                <th className="px-6 py-4 font-medium text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                 <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">Loading collections...</td>
                </tr>
              ) : collections.length > 0 ? (
                collections.map((col) => (
                  <tr key={col.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-primary-600">{col.receiptNumber}</td>
                    <td className="px-6 py-4 text-gray-600">{new Date(col.collectionDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-gray-900 font-medium">{col.outletId}</td>
                    <td className="px-6 py-4 text-gray-600">{col.paymentMode}</td>
                    <td className="px-6 py-4 text-gray-500">{col.referenceNumber || '-'}</td>
                    <td className="px-6 py-4 font-bold text-gray-900 text-right">₹{col.amount.toLocaleString()}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                        col.status === 'Verified' || col.status === 'Cleared' ? 'bg-green-100 text-green-800' :
                        col.status === 'Reversed' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {col.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center space-x-2">
                        {(col.status === 'Pending_Verification' || col.status === 'Draft' || col.status === 'Submitted') && (
                          <button onClick={() => handleVerify(col.id)} className="text-green-600 hover:text-green-800 text-xs font-medium">Verify</button>
                        )}
                        {(col.status === 'Verified' || col.status === 'Cleared') && (
                          <button onClick={() => handleReverse(col.id)} className="text-red-600 hover:text-red-800 text-xs font-medium">Reverse</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="text-gray-400 flex flex-col items-center">
                      <div className="bg-gray-50 p-3 rounded-full mb-3">
                        <IndianRupee className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-sm font-medium text-gray-900 mb-1">No collections yet</h3>
                      <p className="text-sm text-gray-500">Payments recorded in the field app will appear here.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Record Payment</h2>
            
            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Outlet</label>
                <select
                  required
                  value={newPayment.outletId}
                  onChange={(e) => setNewPayment({...newPayment, outletId: e.target.value})}
                  className="w-full rounded-lg border-gray-200 border px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select Outlet...</option>
                  {outlets.map(o => (
                    <option key={o.id} value={o.id}>{o.name} ({o.id})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Invoice (Optional)</label>
                <select
                  value={newPayment.invoiceId}
                  onChange={(e) => setNewPayment({...newPayment, invoiceId: e.target.value})}
                  className="w-full rounded-lg border-gray-200 border px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">-- Apply to Balance --</option>
                  {invoices.filter(i => i.outletId === newPayment.outletId && i.status !== 'Paid').map(i => (
                    <option key={i.id} value={i.id}>{i.invoiceNumber} - Due: ₹{(i.totalAmount - i.paidAmount).toLocaleString()}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                <input
                  type="number"
                  required
                  min="1"
                  step="0.01"
                  value={newPayment.amount}
                  onChange={(e) => setNewPayment({...newPayment, amount: e.target.value})}
                  className="w-full rounded-lg border-gray-200 border px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
                <select
                  value={newPayment.paymentMode}
                  onChange={(e) => setNewPayment({...newPayment, paymentMode: e.target.value as any})}
                  className="w-full rounded-lg border-gray-200 border px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>

              {(newPayment.paymentMode === 'Cheque' || newPayment.paymentMode === 'UPI' || newPayment.paymentMode === 'Bank Transfer') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reference Number</label>
                  <input
                    type="text"
                    required
                    value={newPayment.referenceNumber}
                    onChange={(e) => setNewPayment({...newPayment, referenceNumber: e.target.value})}
                    className="w-full rounded-lg border-gray-200 border px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Txn ID / Cheque No."
                  />
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
                >
                  Save Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
