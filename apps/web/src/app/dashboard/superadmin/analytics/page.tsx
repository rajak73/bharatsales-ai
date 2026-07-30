'use client';

import { useState, useEffect } from 'react';
import { SuperadminService } from '@bharatsales/api-client';
import { Loader2, TrendingUp, ShoppingCart, Users } from 'lucide-react';

export default function PlatformAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loginStats, setLoginStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      SuperadminService.getPlatformAnalytics(),
      SuperadminService.getLoginStatistics(),
    ])
      .then(([analytics, logins]) => {
        setData(analytics);
        setLoginStats(logins);
      })
      .catch((err) => console.error('Failed to load platform analytics:', err))
      .finally(() => setLoading(false));
  }, []);

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
        <h1 className="text-2xl font-bold text-gray-900">Platform Analytics</h1>
        <p className="text-gray-500">Aggregate activity across every organization on the platform.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="flex items-center gap-3 mb-3 text-purple-600">
            <div className="p-3 bg-purple-50 rounded-lg"><TrendingUp className="w-5 h-5" /></div>
            <span className="text-sm font-medium text-gray-500">Total Revenue</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">₹{(data?.totalRevenue || 0).toLocaleString()}</div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3 mb-3 text-blue-600">
            <div className="p-3 bg-blue-50 rounded-lg"><ShoppingCart className="w-5 h-5" /></div>
            <span className="text-sm font-medium text-gray-500">Total Orders</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{data?.totalOrders || 0}</div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3 mb-3 text-green-600">
            <div className="p-3 bg-green-50 rounded-lg"><Users className="w-5 h-5" /></div>
            <span className="text-sm font-medium text-gray-500">Active Users</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{data?.activeUsers || 0}</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-bold text-gray-900 mb-4">Tenant Growth (Last 6 Months)</h3>
          {(!data?.tenantGrowth || data.tenantGrowth.length === 0) ? (
            <p className="text-sm text-gray-400">No new organizations in this period.</p>
          ) : (
            <div className="space-y-2">
              {data.tenantGrowth.map((g: any) => (
                <div key={g.month} className="flex justify-between text-sm">
                  <span className="text-gray-500">{g.month}</span>
                  <span className="font-medium text-gray-900">{g.count} new</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="font-bold text-gray-900 mb-4">Top Organizations by Revenue</h3>
          {(!data?.topTenants || data.topTenants.length === 0) ? (
            <p className="text-sm text-gray-400">No order activity yet.</p>
          ) : (
            <div className="space-y-3">
              {data.topTenants.map((t: any, idx: number) => (
                <div key={t.organizationId} className="flex justify-between items-center text-sm">
                  <span className="text-gray-700">{idx + 1}. {t.name}</span>
                  <span className="font-medium text-gray-900">₹{t.revenue.toLocaleString()} ({t.orderCount} orders)</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-bold text-gray-900 mb-4">Login Activity (Last 30 Days)</h3>
          {(!loginStats?.dailyLogins || loginStats.dailyLogins.length === 0) ? (
            <p className="text-sm text-gray-400">No login activity in this period.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {loginStats.dailyLogins.map((d: any) => (
                <div key={d.date} className="flex justify-between text-sm">
                  <span className="text-gray-500">{d.date}</span>
                  <span className="font-medium text-gray-900">{d.count} logins</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="font-bold text-gray-900 mb-4">Logins by Organization</h3>
          {(!loginStats?.byOrg || loginStats.byOrg.length === 0) ? (
            <p className="text-sm text-gray-400">No login activity in this period.</p>
          ) : (
            <div className="space-y-3">
              {loginStats.byOrg.map((o: any) => (
                <div key={o.organizationId} className="flex justify-between items-center text-sm">
                  <span className="text-gray-700">{o.organizationName}</span>
                  <span className="font-medium text-gray-900">{o.count} logins</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
