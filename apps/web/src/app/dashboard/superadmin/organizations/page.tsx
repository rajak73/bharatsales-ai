'use client';

import { useState, useEffect } from 'react';
import { SuperadminService } from '@bharatsales/api-client';
import { Tenant } from '@bharatsales/shared-types';
import { Loader2, ShieldAlert, CheckCircle, PauseCircle, Activity } from 'lucide-react';

export default function OrganizationsPage() {
  const [tenants, setTenants] = useState<(Tenant & { userCount: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTenant, setNewTenant] = useState({ name: '', plan: 'Starter', adminName: '', adminEmail: '', adminPassword: '' });
  const [successMessage, setSuccessMessage] = useState('');

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

  const updateStatus = async (id: string, status: string) => {
    try {
      setActionLoading(id);
      await SuperadminService.updateTenantStatus(id, status);
      await fetchTenants();
    } catch (error) {
      console.error('Failed to update tenant status:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateTenant = async () => {
    if (!newTenant.name || !newTenant.adminName || !newTenant.adminEmail || !newTenant.adminPassword) return;
    try {
      await SuperadminService.createTenant(newTenant as any);
      setShowCreateModal(false);
      setNewTenant({ name: '', plan: 'Starter', adminName: '', adminEmail: '', adminPassword: '' });
      setSuccessMessage('Organization created successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      await fetchTenants();
    } catch (error) {
      console.error('Failed to create tenant:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active': return <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium flex items-center w-fit"><CheckCircle className="w-3 h-3 mr-1"/> Active</span>;
      case 'Suspended': return <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium flex items-center w-fit"><PauseCircle className="w-3 h-3 mr-1"/> Suspended</span>;
      case 'Trial': return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium flex items-center w-fit"><Activity className="w-3 h-3 mr-1"/> Trial</span>;
      case 'Past Due': return <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium flex items-center w-fit"><ShieldAlert className="w-3 h-3 mr-1"/> Past Due</span>;
      default: return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium w-fit">{status}</span>;
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
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
          <span className="text-sm text-green-800 font-medium">{successMessage}</span>
          <button onClick={() => setSuccessMessage('')} className="text-green-600 hover:text-green-800">✕</button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Organizations</h1>
          <p className="text-gray-500">Manage all tenant organizations on the platform.</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary text-sm">+ Create Organization</button>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-6 py-3 font-medium">Organization Name</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Plan</th>
                <th className="px-6 py-3 font-medium">Users</th>
                <th className="px-6 py-3 font-medium">Registered Date</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tenants.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{tenant.name}</td>
                  <td className="px-6 py-4">{getStatusBadge(tenant.status)}</td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-primary-700 bg-primary-50 px-2 py-1 rounded">
                      {tenant.plan}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium">{tenant.userCount}</td>
                  <td className="px-6 py-4 text-gray-500">
                    {new Date(tenant.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {actionLoading === tenant.id ? (
                      <Loader2 className="w-4 h-4 animate-spin inline-block text-primary-600" />
                    ) : (
                      <>
                        {tenant.status !== 'Active' && (
                          <button onClick={() => updateStatus(tenant.id, 'Active')} className="text-green-600 hover:text-green-800 text-xs font-medium">
                            Activate
                          </button>
                        )}
                        {tenant.status !== 'Suspended' && (
                          <button onClick={() => updateStatus(tenant.id, 'Suspended')} className="text-red-600 hover:text-red-800 text-xs font-medium">
                            Suspend
                          </button>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {tenants.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No organizations found on the platform.
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Create Organization</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name *</label>
                <input
                  type="text"
                  className="input-field"
                  value={newTenant.name}
                  onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
                <select
                  className="input-field"
                  value={newTenant.plan}
                  onChange={(e) => setNewTenant({ ...newTenant, plan: e.target.value })}
                >
                  <option>Starter</option>
                  <option>Growth</option>
                  <option>Enterprise</option>
                </select>
              </div>
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Organization Admin Account</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Admin Name *</label>
                <input
                  type="text"
                  className="input-field"
                  value={newTenant.adminName}
                  onChange={(e) => setNewTenant({ ...newTenant, adminName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Admin Email *</label>
                <input
                  type="email"
                  className="input-field"
                  value={newTenant.adminEmail}
                  onChange={(e) => setNewTenant({ ...newTenant, adminEmail: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Admin Password *</label>
                <input
                  type="password"
                  className="input-field"
                  value={newTenant.adminPassword}
                  onChange={(e) => setNewTenant({ ...newTenant, adminPassword: e.target.value })}
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button onClick={() => setShowCreateModal(false)} className="flex-1 btn-secondary">Cancel</button>
              <button
                onClick={handleCreateTenant}
                disabled={!newTenant.name || !newTenant.adminName || !newTenant.adminEmail || !newTenant.adminPassword}
                className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
