'use client';

import { useState, useEffect } from 'react';
import { AnalyticsService } from '@bharatsales/api-client';
import { Loader2, TrendingUp, TrendingDown, Users, ShoppingCart, DollarSign, Bell } from 'lucide-react';
import { Card, Button } from '@bharatsales/ui';

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
    <div className="space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Welcome back, {user ? user.name.split(' ')[0] : 'Rahul'}!
          </h1>
          <p className="text-gray-500 mt-1 text-sm">Here is your sales overview for today.</p>
        </div>
        <div className="flex items-center gap-4">
          <button className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors relative">
            {/* @ts-ignore */}
            <Bell size={18} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-primary-500 rounded-full"></span>
          </button>
          <Button className="px-5 py-2">
            Generate Report
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {dashboardData?.kpis.map((kpi: any, idx: number) => (
          <Card key={idx} className="p-6 relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600 border border-primary-200">
                {kpi.icon}
              </div>
              <div className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${kpi.up ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {/* @ts-ignore */}
                {kpi.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {kpi.change}
              </div>
            </div>
            
            <p className="text-gray-500 text-sm font-medium mb-1">{kpi.label}</p>
            <h3 className="text-3xl font-bold text-gray-900 tracking-tight">{kpi.value}</h3>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Weekly Sales Chart */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Weekly Sales Overview</h3>
              <p className="text-xs text-gray-500 mt-1">Total orders across all regions</p>
            </div>
            <select className="bg-white border border-gray-200 text-sm text-gray-700 rounded-lg px-3 py-1.5 outline-none focus:border-primary-500">
              <option>This Week</option>
              <option>Last Week</option>
            </select>
          </div>
          
          <div className="flex items-end justify-between h-56 px-2 md:px-6 relative">
            {/* Chart Grid Lines */}
            <div className="absolute inset-0 flex flex-col justify-between z-0 pointer-events-none opacity-20">
              <div className="border-b border-gray-300 w-full h-0"></div>
              <div className="border-b border-gray-300 w-full h-0"></div>
              <div className="border-b border-gray-300 w-full h-0"></div>
              <div className="border-b border-gray-300 w-full h-0"></div>
            </div>

            {/* Bars */}
            {dashboardData?.salesData.map((d: any, i: number) => {
              const isMax = d.orders === maxOrders;
              return (
                <div key={d.day} className="flex flex-col items-center flex-1 relative z-10 group">
                  {/* Tooltip on hover */}
                  <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs font-bold px-2 py-1 rounded shadow pointer-events-none">
                    {d.orders}
                  </div>
                  
                  <div className="w-full flex justify-center mb-3">
                    <div 
                      className={`w-8 sm:w-12 rounded-t-lg transition-all duration-500 ease-out ${isMax ? 'bg-primary-600 shadow-md' : 'bg-primary-100 hover:bg-primary-200'}`} 
                      style={{height: `${maxOrders > 0 ? (d.orders / maxOrders) * 180 : 5}px`}}
                    ></div>
                  </div>
                  <span className={`text-xs font-medium ${isMax ? 'text-primary-700' : 'text-gray-500'}`}>{d.day}</span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Active Team Members */}
        <Card className="p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900">Active Team</h3>
            <button className="text-xs text-primary-600 hover:text-primary-700 font-medium">View All</button>
          </div>
          
          <div className="space-y-4 flex-1">
            {dashboardData?.teamActivity.map((member: any, i: number) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm">
                    {member.avatar}
                  </div>
                  <div className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full ${member.status.includes('Active Now') ? 'bg-green-500' : member.status.includes('Offline') ? 'bg-gray-400' : 'bg-yellow-500'}`}></div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-gray-900 truncate">{member.name}</h4>
                  <p className="text-xs text-gray-500 truncate">{member.location}</p>
                </div>
                
                <div className="text-right">
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${member.status.includes('Active Now') ? 'text-green-600' : member.status.includes('Offline') ? 'text-gray-400' : 'text-yellow-600'}`}>
                    {member.status === 'Active Now' ? 'Online' : member.status.includes('Offline') ? 'Offline' : 'Away'}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          <Button variant="outline" className="w-full mt-4">
            Manage Team Hierarchy
          </Button>
        </Card>

      </div>
    </div>
  );
}

