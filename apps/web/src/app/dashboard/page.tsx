'use client';

import { useState, useEffect } from 'react';
import { AnalyticsService } from '@bharatsales/api-client';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const [user, setUser] = useState<{ name: string; role: string; organizationId: string } | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) { 
      const parsed = JSON.parse(userData);
      setUser(parsed);
      fetchDashboardData(parsed.organizationId);
    }
  }, []);

  const fetchDashboardData = async (orgId: string) => {
    try {
      setLoading(true);
      const data = await AnalyticsService.getDashboardData();
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const teamActivity = dashboardData?.teamActivity || [];

  const maxOrders = dashboardData ? Math.max(...dashboardData.salesData.map((d: any) => d.orders)) : 10;

  const handleExportReport = () => {
    setSuccessMessage('Report exported successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleNewOrder = () => {
    setSuccessMessage('New order form opened!');
    setTimeout(() => setSuccessMessage(''), 2000);
  };

  return (
    <div className="space-y-6">
      {successMessage && (<div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between"><div className="flex items-center space-x-2"><span className="text-green-600">✅</span><span className="text-sm text-green-800 font-medium">{successMessage}</span></div><button onClick={() => setSuccessMessage('')} className="text-green-600 hover:text-green-800">✕</button></div>)}

      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-gray-900">Good afternoon{user ? `, ${user.name.split(' ')[0]}` : ''} 👋</h1><p className="text-gray-500">{user?.role === 'Super Admin' || user?.role === 'Company Admin' ? "Here's what's happening across your organization today." : "Here's your sales progress for today."}</p></div><div className="flex space-x-3"><button onClick={handleExportReport} className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Export Report</button><button onClick={handleNewOrder} className="btn-primary text-sm">+ New Order</button></div></div>

      {(user?.role === 'Super Admin' || user?.role === 'Company Admin' || user?.role === 'Area Manager') ? (
        loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : dashboardData ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">{dashboardData.kpis.map((kpi: any) => (<div key={kpi.label} className="card"><div className="flex items-center justify-between mb-3"><span className="text-2xl">{kpi.icon}</span><span className={`text-xs font-medium px-2 py-1 rounded-full ${kpi.up ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{kpi.change}</span></div><div className="text-2xl font-bold text-gray-900">{kpi.value}</div><div className="text-sm text-gray-500 mt-1">{kpi.label}</div></div>))}</div>
          <div className="grid lg:grid-cols-3 gap-6"><div className="lg:col-span-2 card"><div className="flex items-center justify-between mb-6"><h3 className="font-bold text-gray-900">Weekly Sales Overview</h3><select className="text-sm border border-gray-200 rounded-lg px-3 py-1.5"><option>This Week</option><option>Last Week</option></select></div><div className="flex items-end justify-between h-48 px-2">{dashboardData.salesData.map((d: any) => (<div key={d.day} className="flex flex-col items-center flex-1"><div className="w-full flex justify-center mb-2"><div className="w-10 bg-primary-500 rounded-t-md transition-all hover:bg-primary-600" style={{height: `${maxOrders > 0 ? (d.orders / maxOrders) * 140 : 5}px`}}></div></div><span className="text-xs text-gray-500">{d.day}</span><span className="text-xs font-medium text-gray-700">{d.orders}</span></div>))}</div></div><div className="card"><h3 className="font-bold text-gray-900 mb-6">Monthly Target</h3><div className="flex items-center justify-center mb-6"><div className="relative w-36 h-36"><svg className="w-full h-full transform -rotate-90"><circle cx="72" cy="72" r="60" stroke="#e5e7eb" strokeWidth="12" fill="none" /><circle cx="72" cy="72" r="60" stroke="#3b82f6" strokeWidth="12" fill="none" strokeDasharray={`${2 * Math.PI * 60}`} strokeDashoffset={`${2 * Math.PI * 60 * (1 - (dashboardData.monthlyTarget.percentage/100))}`} strokeLinecap="round" /></svg><div className="absolute inset-0 flex items-center justify-center"><div className="text-center"><div className="text-2xl font-bold text-gray-900">{dashboardData.monthlyTarget.percentage}%</div><div className="text-xs text-gray-500">achieved</div></div></div></div></div><div className="space-y-3"><div className="flex justify-between text-sm"><span className="text-gray-500">Achieved</span><span className="font-medium">₹{dashboardData.monthlyTarget.achieved.toLocaleString()}</span></div><div className="flex justify-between text-sm"><span className="text-gray-500">Target</span><span className="font-medium">₹{dashboardData.monthlyTarget.target.toLocaleString()}</span></div><div className="flex justify-between text-sm"><span className="text-gray-500">Remaining</span><span className="font-medium text-saffron-600">₹{Math.max(0, dashboardData.monthlyTarget.target - dashboardData.monthlyTarget.achieved).toLocaleString()}</span></div></div></div></div>
          <div className="grid lg:grid-cols-2 gap-6"><div className="card"><div className="flex items-center justify-between mb-4"><h3 className="font-bold text-gray-900">Recent Orders</h3><a href="/dashboard/orders" className="text-sm text-primary-600 font-medium hover:text-primary-700">View All</a></div><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-gray-500 border-b border-gray-100"><th className="pb-3 font-medium">Order</th><th className="pb-3 font-medium">Outlet</th><th className="pb-3 font-medium">Amount</th><th className="pb-3 font-medium">Status</th></tr></thead><tbody>{dashboardData.recentOrders.length > 0 ? dashboardData.recentOrders.map((order: any) => (<tr key={order.id} className="border-b border-gray-50 last:border-0"><td className="py-3 font-medium text-gray-900">{order.id}</td><td className="py-3 text-gray-600">{order.outlet}</td><td className="py-3 font-medium">{order.amount}</td><td className="py-3"><span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${order.status === 'Delivered' ? 'bg-green-100 text-green-700' : order.status === 'Dispatched' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>{order.status}</span></td></tr>)) : <tr><td colSpan={4} className="py-4 text-center text-gray-500">No recent orders</td></tr>}</tbody></table></div></div><div className="card"><div className="flex items-center justify-between mb-4"><h3 className="font-bold text-gray-900">Team Activity</h3><a href="/dashboard/team" className="text-sm text-primary-600 font-medium hover:text-primary-700">View All</a></div><div className="space-y-3">{teamActivity.map((member: any) => (<div key={member.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"><div className="flex items-center space-x-3"><div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center"><span className="text-primary-700 font-medium text-xs">{member.name.split(' ').map((n: any) => n[0]).join('')}</span></div><div><div className="text-sm font-medium text-gray-900">{member.name}</div><div className="text-xs text-gray-500">{member.location} • {member.visits} visits</div></div></div><div className="text-right"><div className="text-sm font-medium text-gray-900">{member.orders}</div><span className={`text-xs ${member.status === 'Working' ? 'text-green-600' : 'text-yellow-600'}`}>{member.status}</span></div></div>))}</div></div></div>
          <div className="card border-l-4 border-l-saffron-500"><h3 className="font-bold text-gray-900 mb-3">⚠️ Alerts Requiring Attention</h3><div className="space-y-2"><div className="flex items-center justify-between p-3 bg-saffron-50 rounded-lg"><div className="flex items-center space-x-3"><span className="text-saffron-500">💰</span><span className="text-sm text-gray-700">3 outlets have exceeded credit limit</span></div><button className="text-xs font-medium text-saffron-600 hover:text-saffron-700">Review</button></div><div className="flex items-center justify-between p-3 bg-red-50 rounded-lg"><div className="flex items-center space-x-3"><span className="text-red-500">📦</span><span className="text-sm text-gray-700">2 batches expiring within 7 days</span></div><button className="text-xs font-medium text-red-600 hover:text-red-700">Review</button></div></div></div>
        </>
        ) : null
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {dashboardData?.kpis.map((kpi: any) => (
              <div key={kpi.label} className="card">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl">{kpi.icon}</span>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${kpi.up ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{kpi.change}</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{kpi.value}</div>
                <div className="text-sm text-gray-500 mt-1">{kpi.label}</div>
              </div>
            ))}
          </div>
          
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="card"><div className="flex items-center justify-between mb-4"><h3 className="font-bold text-gray-900">My Recent Orders</h3><a href="/dashboard/orders" className="text-sm text-primary-600 font-medium hover:text-primary-700">View All</a></div><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-gray-500 border-b border-gray-100"><th className="pb-3 font-medium">Order</th><th className="pb-3 font-medium">Outlet</th><th className="pb-3 font-medium">Amount</th><th className="pb-3 font-medium">Status</th></tr></thead><tbody>{(dashboardData?.recentOrders || []).slice(0,3).map((order: any) => (<tr key={order.id} className="border-b border-gray-50 last:border-0"><td className="py-3 font-medium text-gray-900">{order.id}</td><td className="py-3 text-gray-600">{order.outlet}</td><td className="py-3 font-medium">{order.amount}</td><td className="py-3"><span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${order.status === 'Delivered' ? 'bg-green-100 text-green-700' : order.status === 'Dispatched' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>{order.status}</span></td></tr>))}</tbody></table></div></div>
            <div className="card"><div className="flex items-center justify-between mb-4"><h3 className="font-bold text-gray-900">Today's Beat Plan</h3><a href="/dashboard/beats" className="text-sm text-primary-600 font-medium hover:text-primary-700">View All</a></div><div className="space-y-3"><div className="p-4 bg-gray-50 rounded-lg text-center"><p className="text-gray-500 text-sm">Please check the Beats tab for your full plan.</p></div></div></div>
          </div>
        </>
      )}
    </div>
  );
}
