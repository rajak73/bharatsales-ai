import React, { useState, useEffect } from 'react';
import { db } from '../database/db';
import type { Outlet, Invoice, PaymentCollection } from '@bharatsales/shared-types';
import { ChevronLeft, CheckCircle, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

function getCurrentUserId(): string {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw).id || 'local-user' : 'local-user';
  } catch {
    return 'local-user';
  }
}

export default function CollectionScreen({ outletId, onBack }: { outletId: string, onBack: () => void }) {
  const [outlet, setOutlet] = useState<Outlet | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Form State
  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'Cheque' | 'UPI' | 'Bank Transfer'>('Cash');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      const o = await db.outlets.get(outletId);
      if (o) setOutlet(o);

      const invs = await db.invoices.where('outletId').equals(outletId).toArray();
      setInvoices(invs.filter(i => i.status !== 'Paid'));
      setLoading(false);
    };
    fetchData();
  }, [outletId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!outlet) return;

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setFormError('Please enter a valid amount.');
      return;
    }

    setFormError('');
    setSubmitting(true);

    const idempotencyKey = crypto.randomUUID();
    const collection: PaymentCollection = {
      id: idempotencyKey,
      organizationId: outlet.organizationId,
      receiptNumber: `REC-${Date.now()}`,
      invoiceId: selectedInvoiceId || undefined,
      outletId: outlet.id,
      collectedByUserId: getCurrentUserId(),
      amount: numericAmount,
      paymentMode,
      referenceNumber: referenceNumber || undefined,
      status: 'Pending',
      collectionDate: new Date().toISOString(),
      idempotencyKey,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save locally
    await db.collections.add(collection);

    // Queue for sync
    await db.syncQueue.add({
      action: 'CREATE_PAYMENT',
      payload: collection,
      status: 'PENDING',
      createdAt: Date.now()
    });

    setSubmitting(false);
    setIsSubmitted(true);
    setTimeout(onBack, 2000);
  };

  if (loading || !outlet) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 p-6 text-center">
        <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-1">Payment Recorded</h2>
        <p className="text-sm text-gray-500">Queued for sync — will upload automatically once online.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="bg-white px-4 py-3 flex items-center shadow-sm">
        <button onClick={onBack} className="p-2 -ml-2 mr-2">
          <ChevronLeft className="w-6 h-6 text-gray-700" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-gray-900">Record Payment</h1>
          <p className="text-xs text-gray-500">{outlet.name}</p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 pb-8">
        {formError && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            {formError}
          </div>
        )}

        <div className="bg-white rounded-xl p-4 shadow-sm mb-4 border border-gray-100">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-gray-500">Outstanding Balance</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            ₹{outlet.commercial?.outstandingBalance?.toLocaleString() || 0}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Amount (₹)</label>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                placeholder="e.g. 5000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
              <div className="grid grid-cols-2 gap-2">
                {['Cash', 'UPI', 'Cheque', 'Bank Transfer'].map(mode => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setPaymentMode(mode as any)}
                    className={`px-3 py-2 text-sm font-medium rounded-lg border ${
                      paymentMode === mode 
                        ? 'bg-primary-50 border-primary-500 text-primary-700' 
                        : 'bg-white border-gray-200 text-gray-700'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {(paymentMode === 'Cheque' || paymentMode === 'UPI' || paymentMode === 'Bank Transfer') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reference Number</label>
                <input
                  type="text"
                  required
                  value={referenceNumber}
                  onChange={e => setReferenceNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Txn ID / Cheque No."
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Link to Invoice (Optional)</label>
              <select
                value={selectedInvoiceId}
                onChange={e => setSelectedInvoiceId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">-- Advance / Generic Payment --</option>
                {invoices.map(inv => (
                  <option key={inv.id} value={inv.id}>
                    {inv.invoiceNumber} (₹{(inv.totalAmount - inv.paidAmount).toLocaleString()} due)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:bg-primary-700 active:transform active:scale-95 transition-all flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="w-5 h-5 mr-2" />
            )}
            {submitting ? 'Saving...' : 'Record Payment'}
          </button>
        </form>
      </main>
    </div>
  );
}
