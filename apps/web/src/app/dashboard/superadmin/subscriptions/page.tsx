'use client';

import { useState, useEffect } from 'react';
import { SuperadminService } from '@bharatsales/api-client';
import { Tenant } from '@bharatsales/shared-types';
import { Loader2 } from 'lucide-react';

export default function SubscriptionsPage() {
  const [tenants, setTenants] = useState<(Tenant & { userCount: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ plan: '', billingCycle: '', subscriptionUsersLimit: 0 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const data = await SuperadminService.getAllTenants();
      setTenants(data);
    } catch (error) {
      console.error('Failed to fetch tenants:', error);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (tenant: Tenant & { userCount: number }) => {
    setEditing(tenant.id);
    setForm({
      plan: tenant.plan,
      billingCycle: tenant.billingCycle || 'Annual',
      subscriptionUsersLimit: tenant.subscriptionUsersLimit || 10
    });
  };

  const handleSave = async (id: string) => {
    try {
      setSaving(true);
      await SuperadminService.updateSubscription(id, form);
      setEditing(null);
      await fetchTenants();
    } catch (error) {
      console.error('Failed to update subscription:', error);
    } finally {
      setSaving(false);
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
        <h1 className="text-2xl font-bold text-gray-900">Subscription Management</h1>
        <p className="text-gray-500">Adjust each organization's plan, billing cycle, and user limits.</p>
      </div>

      <div className="grid gap-4">
        {tenants.map((tenant) => (
          <div key={tenant.id} className="card">
            {editing === tenant.id ? (
              <div className="space-y-4">
                <h3 className="font-bold text-gray-900">{tenant.name}</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Plan</label>
                    <select className="input-field" value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })}>
                      <option>Starter</option>
                      <option>Growth</option>
                      <option>Enterprise</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Billing Cycle</label>
                    <select className="input-field" value={form.billingCycle} onChange={(e) => setForm({ ...form, billingCycle: e.target.value })}>
                      <option>Monthly</option>
                      <option>Annual</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">User Limit</label>
                    <input
                      type="number"
                      className="input-field"
                      value={form.subscriptionUsersLimit}
                      onChange={(e) => setForm({ ...form, subscriptionUsersLimit: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button onClick={() => setEditing(null)} className="btn-secondary text-sm">Cancel</button>
                  <button onClick={() => handleSave(tenant.id)} disabled={saving} className="btn-primary text-sm disabled:opacity-50">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-900">{tenant.name}</h3>
                  <p className="text-sm text-gray-500">
                    {tenant.plan} plan • {tenant.billingCycle || 'Annual'} billing • Up to {tenant.subscriptionUsersLimit || 10} users • {tenant.userCount} currently
                  </p>
                </div>
                <button onClick={() => startEdit(tenant)} className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                  Edit Plan
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
