'use client';

import { useState, useEffect } from 'react';
import { SuperadminService } from '@bharatsales/api-client';
import { Tenant } from '@bharatsales/shared-types';
import { Loader2, ShieldAlert, CheckCircle, PauseCircle, Activity } from 'lucide-react';

export default function SuperadminPage() {
  const [tenants, setTenants] = useState<(Tenant & { userCount: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active': return <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium flex items-center"><CheckCircle className="w-3 h-3 mr-1"/> Active</span>;
      case 'Suspended': return <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium flex items-center"><PauseCircle className="w-3 h-3 mr-1"/> Suspended</span>;
      case 'Trial': return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium flex items-center"><Activity className="w-3 h-3 mr-1"/> Trial</span>;
      case 'Past Due': return <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium flex items-center"><ShieldAlert className="w-3 h-3 mr-1"/> Past Due</span>;
      default: return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">{status}</span>;
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
        <h1 className="text-2xl font-bold text-gray-900">Super Admin Console</h1>
        <p className="text-gray-500">Manage all tenant organizations and platform subscriptions.</p>
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
                          <button
                            onClick={() => updateStatus(tenant.id, 'Active')}
                            className="text-green-600 hover:text-green-800 text-xs font-medium"
                          >
                            Activate
                          </button>
                        )}
                        {tenant.status !== 'Suspended' && (
                          <button
                            onClick={() => updateStatus(tenant.id, 'Suspended')}
                            className="text-red-600 hover:text-red-800 text-xs font-medium"
                          >
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
    </div>
  );
}
