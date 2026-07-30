'use client';

import { useEffect, useState } from 'react';
import { OrdersService, OutletsService, TargetsService, UsersService } from '@bharatsales/api-client';
import { Loader2, ShoppingCart, Store, Users, Target } from 'lucide-react';
import { Card } from '@bharatsales/ui';

export function OrgAdminDashboard({ userName }: { userName: string }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [outlets, setOutlets] = useState<any[]>([]);
  const [targets, setTargets] = useState<any[]>([]);
  const [userCount, setUserCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      OrdersService.getOrders().catch(() => []),
      OutletsService.getOutlets().catch(() => []),
      TargetsService.getTargets().catch(() => []),
      UsersService.getUsers().catch(() => []),
    ])
      .then(([o, out, t, u]) => {
        setOrders(o || []);
        setOutlets(out || []);
        setTargets(t || []);
        setUserCount((u || []).length);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const totalRevenue = orders.reduce((sum, o) => sum + (o.totals?.grandTotal || 0), 0);
  const totalTarget = targets.reduce((sum, t) => sum + (t.targetValue || 0), 0);
  const totalActual = targets.reduce((sum, t) => sum + (t.actualValue || 0), 0);
  const achievementPct = totalTarget > 0 ? Math.round((totalActual / totalTarget) * 100) : 0;

  const tiles = [
    { label: 'Total Orders', value: orders.length, icon: <ShoppingCart className="w-5 h-5" /> },
    { label: 'Total Sales Value', value: `₹${totalRevenue.toLocaleString('en-IN')}`, icon: <ShoppingCart className="w-5 h-5" /> },
    { label: 'Active Outlets', value: outlets.filter(o => o.status === 'Active').length, icon: <Store className="w-5 h-5" /> },
    { label: 'Employees', value: userCount, icon: <Users className="w-5 h-5" /> },
  ];

  const recentOrders = [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Welcome back, {userName.split(' ')[0]}!</h1>
        <p className="text-gray-500 mt-1 text-sm">Your organization's sales overview for today.</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-1">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600 border border-primary-200">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Org-Wide Target Achievement</p>
              <h3 className="text-2xl font-bold text-gray-900">{achievementPct}%</h3>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div className="h-2.5 rounded-full bg-primary-600" style={{ width: `${Math.min(100, achievementPct)}%` }}></div>
          </div>
        </Card>

        <Card className="p-6 lg:col-span-2">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Orders</h3>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-gray-500">No orders yet.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentOrders.map((order: any) => (
                <div key={order.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{order.orderNumber}</p>
                    <p className="text-xs text-gray-500">{(order.status || '').replace(/_/g, ' ')}</p>
                  </div>
                  <p className="text-sm font-bold text-gray-900">₹{(order.totals?.grandTotal || 0).toLocaleString('en-IN')}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
