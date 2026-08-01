'use client';

import { useEffect, useState } from 'react';
import { SuperadminService } from '@bharatsales/api-client';
import { Loader2, Building2, CheckCircle, IndianRupee, Users } from 'lucide-react';
import { Card } from '@bharatsales/ui';

export function SuperAdminDashboard({ userName }: { userName: string }) {
  const [dashboard, setDashboard] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      SuperadminService.getPlatformDashboard().catch(() => null),
      SuperadminService.getMetrics().catch(() => null),
    ])
      .then(([d, m]) => {
        setDashboard(d);
        setMetrics(m);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  const tiles = [
    { label: 'Total Organizations', value: dashboard?.totalTenants ?? 0, icon: <Building2 className="w-5 h-5" /> },
    { label: 'Active Organizations', value: dashboard?.activeTenants ?? 0, icon: <CheckCircle className="w-5 h-5" /> },
    { label: 'Monthly Recurring Revenue', value: `₹${(metrics?.mrr ?? 0).toLocaleString('en-IN')}`, icon: <IndianRupee className="w-5 h-5" /> },
    { label: 'Total Platform Users', value: dashboard?.totalUsers ?? 0, icon: <Users className="w-5 h-5" /> },
  ];

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Welcome back, {userName.split(' ')[0]}!</h1>
        <p className="text-gray-500 mt-1 text-sm">Platform-wide overview across every organization.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {tiles.map((tile, idx) => (
          <Card key={idx} className="p-6">
            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600 border border-primary-200 mb-4">
              {tile.icon}
            </div>
            <p className="text-gray-500 text-sm font-medium mb-1">{tile.label}</p>
            <h3 className="text-2xl font-bold text-gray-900 tracking-tight">{tile.value}</h3>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Signups (Last 7 Days)</h3>
          {(dashboard?.recentSignups || []).length === 0 ? (
            <p className="text-sm text-gray-500">No new organizations this week.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {dashboard.recentSignups.map((org: any, idx: number) => (
                <div key={idx} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{org.name}</p>
                    <p className="text-xs text-gray-500">{org.plan} · {org.status}</p>
                  </div>
                  <p className="text-xs text-gray-500">{new Date(org.createdAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Plan Breakdown</h3>
          {(metrics?.plans || []).length === 0 ? (
            <p className="text-sm text-gray-500">No subscription data yet.</p>
          ) : (
            <div className="space-y-3">
              {metrics.plans.map((plan: any) => (
                <div key={plan.name} className="flex justify-between items-center text-sm">
                  <span className="text-gray-700">{plan.name}</span>
                  <span className="font-medium text-gray-900">{plan.tenants} orgs</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
