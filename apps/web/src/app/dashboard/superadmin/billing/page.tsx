'use client';

import { useState, useEffect } from 'react';
import { SuperadminService } from '@bharatsales/api-client';
import { Tenant } from '@bharatsales/shared-types';
import { Loader2, IndianRupee } from 'lucide-react';

export default function BillingPage() {
  const [tenants, setTenants] = useState<(Tenant & { userCount: number })[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [recordingFor, setRecordingFor] = useState<string | null>(null);
  const [form, setForm] = useState({ amount: '', plan: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tenantData, metricsData] = await Promise.all([
        SuperadminService.getAllTenants(),
        SuperadminService.getMetrics(),
      ]);
      setTenants(tenantData);
      setMetrics(metricsData);
    } catch (error) {
      console.error('Failed to fetch billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openRecordPayment = (tenant: Tenant) => {
    setRecordingFor(tenant.id);
    setForm({ amount: '', plan: tenant.plan });
  };

  const handleRecordPayment = async () => {
    if (!recordingFor || !form.amount) return;
    try {
      await SuperadminService.addBillingRecord(recordingFor, form);
      setRecordingFor(null);
      await fetchData();
    } catch (error) {
      console.error('Failed to record payment:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
        <p className="text-gray-500">Recurring revenue and per-organization billing history.</p>
      </div>

      <div className="card">
        <div className="flex items-center gap-3 mb-2 text-primary-600">
          <div className="p-3 bg-primary-50 rounded-lg"><IndianRupee className="w-5 h-5" /></div>
          <h3 className="font-bold text-gray-900">Monthly Recurring Revenue</h3>
        </div>
        <div className="text-3xl font-bold text-gray-900">₹{(metrics?.mrr || 0).toLocaleString()}</div>
        <p className="text-xs text-gray-400 mt-1">Computed from active organizations' current plans.</p>
      </div>

      <div className="grid gap-4">
        {tenants.map((tenant) => (
          <div key={tenant.id} className="card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900">{tenant.name}</h3>
              <button onClick={() => openRecordPayment(tenant)} className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                Record Payment
              </button>
            </div>
            {(!tenant.billingHistory || tenant.billingHistory.length === 0) ? (
              <p className="text-sm text-gray-400">No billing history recorded yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="py-1 font-medium">Date</th>
                    <th className="py-1 font-medium">Plan</th>
                    <th className="py-1 font-medium text-right">Amount</th>
                    <th className="py-1 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tenant.billingHistory.map((record: any) => (
                    <tr key={record.id} className="border-t border-gray-100">
                      <td className="py-2 text-gray-600">{new Date(record.date).toLocaleDateString()}</td>
                      <td className="py-2 text-gray-600">{record.plan}</td>
                      <td className="py-2 text-right font-medium text-gray-900">₹{record.amount}</td>
                      <td className="py-2 text-right text-green-600">{record.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {recordingFor === tenant.id && (
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Amount (₹)</label>
                    <input type="text" className="input-field" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="24999" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Plan</label>
                    <input type="text" className="input-field" value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })} />
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button onClick={() => setRecordingFor(null)} className="btn-secondary text-sm">Cancel</button>
                  <button onClick={handleRecordPayment} disabled={!form.amount} className="btn-primary text-sm disabled:opacity-50">Save</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
