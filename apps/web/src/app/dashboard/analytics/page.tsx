'use client';

import { useState, useEffect } from 'react';
import { AnalyticsService } from '@bharatsales/api-client';
import { Loader2, TrendingUp, TrendingDown, Users, ShoppingCart, DollarSign, Target, RefreshCw, BarChart2, Activity } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      setRefreshing(true);
      const result = await AnalyticsService.getDashboardData();
      setData(result);
      setError('');
    } catch (err: any) {
      setError('Failed to load analytics. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-red-600 mb-4">{error}</p>
        <button onClick={fetchData} className="btn-primary">Retry</button>
      </div>
    );
  }

  const kpis = [
    {
      label: 'Total Revenue',
      value: data?.kpis?.totalRevenue ? `₹${(data.kpis.totalRevenue / 100000).toFixed(1)}L` : '—',
      icon: DollarSign,
      color: 'text-green-600',
      bg: 'bg-green-50',
      trend: data?.kpis?.revenueGrowth,
    },
    {
      label: 'Total Orders',
      value: data?.kpis?.totalOrders ?? '—',
      icon: ShoppingCart,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      trend: data?.kpis?.orderGrowth,
    },
    {
      label: 'Active Outlets',
      value: data?.kpis?.activeOutlets ?? '—',
      icon: Target,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      label: 'Active Reps',
      value: data?.kpis?.activeReps ?? '—',
      icon: Users,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Real-time performance metrics across your organization</p>
        </div>
        <button
          onClick={fetchData}
          disabled={refreshing}
          className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500 font-medium">{kpi.label}</span>
                <div className={`w-9 h-9 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${kpi.color}`} />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900">{kpi.value}</div>
              {kpi.trend !== undefined && (
                <div className={`flex items-center space-x-1 mt-1 text-xs font-medium ${kpi.trend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {kpi.trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  <span>{Math.abs(kpi.trend)}% vs last month</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Sales Chart + Top Products */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Sales Trend */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center space-x-2 mb-4">
            <Activity className="w-5 h-5 text-primary-600" />
            <h2 className="font-semibold text-gray-900">Sales Trend</h2>
          </div>
          {data?.salesData?.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data.salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, 'Revenue']} />
                <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: '#6366f1', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400">No sales data available</div>
          )}
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center space-x-2 mb-4">
            <BarChart2 className="w-5 h-5 text-amber-500" />
            <h2 className="font-semibold text-gray-900">Top Products</h2>
          </div>
          {data?.topProducts?.length > 0 ? (
            <div className="space-y-3">
              {data.topProducts.slice(0, 5).map((p: any, idx: number) => (
                <div key={p.name || idx} className="flex items-center space-x-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.sales ?? p.orders ?? 0} units</p>
                  </div>
                  <span className="text-sm font-semibold text-gray-700">
                    {p.revenue ? `₹${Number(p.revenue).toLocaleString()}` : '—'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400">No product data</div>
          )}
        </div>
      </div>

      {/* Orders Bar Chart + Zone Performance */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">Orders by Month</h2>
          {data?.salesData?.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="orders" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-40 flex items-center justify-center text-gray-400">No data</div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">Zone Performance</h2>
          {data?.zonePerformance?.length > 0 ? (
            <div className="flex items-center space-x-4">
              <ResponsiveContainer width="50%" height={160}>
                <PieChart>
                  <Pie data={data.zonePerformance} dataKey="revenue" nameKey="zone" cx="50%" cy="50%" outerRadius={60}>
                    {data.zonePerformance.map((_: any, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: any) => `₹${Number(val).toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {data.zonePerformance.slice(0, 5).map((z: any, i: number) => (
                  <div key={z.zone || i} className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-xs text-gray-600 truncate flex-1">{z.zone}</span>
                    <span className="text-xs font-medium text-gray-800">₹{Number(z.revenue || 0).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-gray-400">No zone data</div>
          )}
        </div>
      </div>

      {/* Top Sales Reps */}
      {data?.topSalesReps?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">Top Sales Representatives</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="pb-3 font-medium">Name</th>
                  <th className="pb-3 font-medium">Orders</th>
                  <th className="pb-3 font-medium">Revenue</th>
                  <th className="pb-3 font-medium">Visits</th>
                </tr>
              </thead>
              <tbody>
                {data.topSalesReps.map((rep: any, idx: number) => (
                  <tr key={rep.name || idx} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 font-medium text-gray-900">{rep.name}</td>
                    <td className="py-3 text-gray-600">{rep.orders ?? '—'}</td>
                    <td className="py-3 text-gray-600">{rep.revenue ? `₹${Number(rep.revenue).toLocaleString()}` : '—'}</td>
                    <td className="py-3 text-gray-600">{rep.visits ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
