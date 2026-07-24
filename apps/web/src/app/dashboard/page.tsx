'use client';

import { useState, useEffect } from 'react';
import { AnalyticsService } from '@bharatsales/api-client';
import { Loader2, TrendingUp, TrendingDown, Users, ShoppingCart, DollarSign, Bell } from 'lucide-react';

export default function DashboardPage() {
  const [user, setUser] = useState<{ name: string; role: string; organizationId: string } | null>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) { 
      const parsed = JSON.parse(userData);
      setUser(parsed);
      fetchDashboardData(parsed.organizationId);
    } else {
      // Mock user for UI presentation if not logged in
      setUser({ name: 'Rahul', role: 'Sales Manager', organizationId: '1' });
      fetchDashboardData('1');
    }
  }, []);

  const fetchDashboardData = async (orgId: string) => {
    try {
      setLoading(true);
      const data = await AnalyticsService.getDashboardData().catch(() => null);
      
      if (data && data.salesData && data.kpis) {
        setDashboardData(data);
      } else {
        // Fallback to mock data for presentation
        setDashboardData({
          kpis: [
            // @ts-ignore - Lucide icon types issue in React 19
            { label: 'Total Revenue', value: '₹1.2M', change: '+12%', up: true, icon: <DollarSign className="w-5 h-5" /> },
            // @ts-ignore
            { label: 'Total Orders', value: '1,420', change: '+8%', up: true, icon: <ShoppingCart className="w-5 h-5" /> },
            // @ts-ignore
            { label: 'Active Users', value: '840', change: '-2%', up: false, icon: <Users className="w-5 h-5" /> }
          ],
          salesData: [
            { day: 'Mon', orders: 120 }, { day: 'Tue', orders: 200 }, { day: 'Wed', orders: 150 },
            { day: 'Thu', orders: 280 }, { day: 'Fri', orders: 220 }, { day: 'Sat', orders: 340 }, { day: 'Sun', orders: 190 }
          ],
          teamActivity: [
            { name: 'Amit Kumar', location: 'Delhi North', status: 'Active Now', avatar: 'AK' },
            { name: 'Priya Singh', location: 'Gurgaon', status: 'Active 5m ago', avatar: 'PS' },
            { name: 'Rajesh Sharma', location: 'Noida', status: 'Active 12m ago', avatar: 'RS' },
            { name: 'Sneha Gupta', location: 'South Delhi', status: 'Offline', avatar: 'SG' }
          ]
        });
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        {/* @ts-ignore */}
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const maxOrders = dashboardData ? Math.max(...dashboardData.salesData.map((d: any) => d.orders)) : 10;

  return (
    <div className="min-h-screen bg-[#0B1120] text-white p-6 -m-6 sm:-m-8 lg:-m-8 rounded-tl-3xl font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Welcome back, {user ? user.name.split(' ')[0] : 'Rahul'}!
          </h1>
          <p className="text-gray-400 mt-1 text-sm">Here is your sales overview for today.</p>
        </div>
        <div className="flex items-center gap-4">
          <button className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/10 transition-colors relative">
            {/* @ts-ignore */}
            <Bell size={18} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full"></span>
          </button>
          <button className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium text-sm transition-colors shadow-lg shadow-blue-500/20">
            Generate Report
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {dashboardData?.kpis.map((kpi: any, idx: number) => (
          <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm relative overflow-hidden">
            {/* Subtle glow effect */}
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/20 rounded-full blur-2xl"></div>
            
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 border border-blue-500/20">
                {kpi.icon}
              </div>
              <div className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${kpi.up ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                {/* @ts-ignore */}
                {kpi.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {kpi.change}
              </div>
            </div>
            
            <p className="text-gray-400 text-sm font-medium mb-1">{kpi.label}</p>
            <h3 className="text-3xl font-bold text-white tracking-tight">{kpi.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Weekly Sales Chart */}
        <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-lg font-bold text-white">Weekly Sales Overview</h3>
              <p className="text-xs text-gray-400 mt-1">Total orders across all regions</p>
            </div>
            <select className="bg-[#0f172a] border border-white/10 text-sm text-gray-300 rounded-lg px-3 py-1.5 outline-none focus:border-blue-500">
              <option>This Week</option>
              <option>Last Week</option>
            </select>
          </div>
          
          <div className="flex items-end justify-between h-56 px-2 md:px-6 relative">
            {/* Chart Grid Lines */}
            <div className="absolute inset-0 flex flex-col justify-between z-0 pointer-events-none opacity-10">
              <div className="border-b border-white w-full h-0"></div>
              <div className="border-b border-white w-full h-0"></div>
              <div className="border-b border-white w-full h-0"></div>
              <div className="border-b border-white w-full h-0"></div>
            </div>

            {/* Bars */}
            {dashboardData?.salesData.map((d: any, i: number) => {
              const isMax = d.orders === maxOrders;
              return (
                <div key={d.day} className="flex flex-col items-center flex-1 relative z-10 group">
                  {/* Tooltip on hover */}
                  <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-white text-black text-xs font-bold px-2 py-1 rounded shadow-lg pointer-events-none">
                    {d.orders}
                  </div>
                  
                  <div className="w-full flex justify-center mb-3">
                    <div 
                      className={`w-8 sm:w-12 rounded-t-lg transition-all duration-500 ease-out ${isMax ? 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-white/20 hover:bg-white/30'}`} 
                      style={{height: `${maxOrders > 0 ? (d.orders / maxOrders) * 180 : 5}px`}}
                    ></div>
                  </div>
                  <span className={`text-xs font-medium ${isMax ? 'text-blue-400' : 'text-gray-400'}`}>{d.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Team Members */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-white">Active Team</h3>
            <button className="text-xs text-blue-400 hover:text-blue-300 font-medium">View All</button>
          </div>
          
          <div className="space-y-4 flex-1">
            {dashboardData?.teamActivity.map((member: any, i: number) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5 cursor-pointer">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                    {member.avatar}
                  </div>
                  <div className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-[#0f172a] rounded-full ${member.status.includes('Active Now') ? 'bg-green-500' : member.status.includes('Offline') ? 'bg-gray-500' : 'bg-yellow-500'}`}></div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-white truncate">{member.name}</h4>
                  <p className="text-xs text-gray-400 truncate">{member.location}</p>
                </div>
                
                <div className="text-right">
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${member.status.includes('Active Now') ? 'text-green-400' : member.status.includes('Offline') ? 'text-gray-500' : 'text-yellow-400'}`}>
                    {member.status === 'Active Now' ? 'Online' : member.status.includes('Offline') ? 'Offline' : 'Away'}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          <button className="w-full mt-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium rounded-xl transition-colors">
            Manage Team Hierarchy
          </button>
        </div>

      </div>
    </div>
  );
}

