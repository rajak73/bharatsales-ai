'use client';

import { useState, useEffect } from 'react';
import { SuperadminService } from '@bharatsales/api-client';
import { Loader2, Building2, Users, Database, Clock } from 'lucide-react';

export default function PlatformDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    SuperadminService.getPlatformDashboard()
      .then(setData)
      .catch((err) => console.error('Failed to load platform dashboard:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  const dbHealthy = data?.database?.status === 'connected';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Platform Dashboard</h1>
        <p className="text-gray-500">Cross-tenant overview of the BharatSales platform.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-3 mb-3 text-primary-600">
            <div className="p-3 bg-primary-50 rounded-lg"><Building2 className="w-5 h-5" /></div>
            <span className="text-sm font-medium text-gray-500">Total Organizations</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{data?.totalTenants ?? 0}</div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3 mb-3 text-green-600">
            <div className="p-3 bg-green-50 rounded-lg"><Building2 className="w-5 h-5" /></div>
            <span className="text-sm font-medium text-gray-500">Active Organizations</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{data?.activeTenants ?? 0}</div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3 mb-3 text-blue-600">
            <div className="p-3 bg-blue-50 rounded-lg"><Users className="w-5 h-5" /></div>
            <span className="text-sm font-medium text-gray-500">Total Users</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{data?.totalUsers ?? 0}</div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-3 rounded-lg ${dbHealthy ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}><Database className="w-5 h-5" /></div>
            <span className="text-sm font-medium text-gray-500">Database</span>
          </div>
          <div className={`text-lg font-bold capitalize ${dbHealthy ? 'text-green-600' : 'text-red-600'}`}>{data?.database?.status ?? 'unknown'}</div>
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-400" />
          <h3 className="font-bold text-gray-900">Recent Signups (Last 7 Days)</h3>
        </div>
        {(!data?.recentSignups || data.recentSignups.length === 0) ? (
          <div className="text-center py-8 text-gray-500">No new organizations signed up in the last 7 days.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-gray-500">
                <th className="px-6 py-3 font-medium">Organization</th>
                <th className="px-6 py-3 font-medium">Plan</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Signed Up</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.recentSignups.map((t: any) => (
                <tr key={t._id}>
                  <td className="px-6 py-3 font-medium text-gray-900">{t.name}</td>
                  <td className="px-6 py-3 text-gray-600">{t.plan}</td>
                  <td className="px-6 py-3 text-gray-600">{t.status}</td>
                  <td className="px-6 py-3 text-gray-500">{new Date(t.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
