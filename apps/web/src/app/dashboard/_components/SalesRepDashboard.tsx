'use client';

import { useEffect, useState } from 'react';
import { BeatsService, AttendanceService, OrdersService, PerformanceService } from '@bharatsales/api-client';
import { Loader2, MapPin, Clock, ShoppingCart, Target } from 'lucide-react';
import { Card } from '@bharatsales/ui';

export function SalesRepDashboard({ userName }: { userName: string }) {
  const [beat, setBeat] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [targets, setTargets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      BeatsService.getTodayBeat().catch(() => null),
      AttendanceService.getCurrentSession().catch(() => null),
      OrdersService.getOrders({ mine: true }).catch(() => []),
      PerformanceService.getMyTargets().catch(() => []),
    ])
      .then(([b, s, o, t]) => {
        setBeat(b);
        setSession(s);
        setOrders(o || []);
        setTargets(t || []);
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

  const todayOrders = orders.filter(o => {
    const created = new Date(o.createdAt);
    const now = new Date();
    return created.toDateString() === now.toDateString();
  });
  const totalTarget = targets.reduce((sum, t) => sum + (t.targetValue || 0), 0);
  const totalActual = targets.reduce((sum, t) => sum + (t.actualValue || 0), 0);
  const achievementPct = totalTarget > 0 ? Math.round((totalActual / totalTarget) * 100) : 0;

  const attendanceLabel = session?.status === 'Active' ? 'Checked In' : session?.status === 'On_Break' ? 'On Break' : 'Not Started';
  const outletsCount = beat?.beat?.outlets?.length ?? 0;

  const tiles = [
    { label: 'Attendance', value: attendanceLabel, icon: <Clock className="w-5 h-5" /> },
    { label: "Today's Beat Progress", value: `${beat?.completedVisits ?? 0}/${outletsCount}`, icon: <MapPin className="w-5 h-5" /> },
    { label: "Today's Orders", value: todayOrders.length, icon: <ShoppingCart className="w-5 h-5" /> },
    { label: 'Target Achievement', value: `${achievementPct}%`, icon: <Target className="w-5 h-5" /> },
  ];

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Welcome back, {userName.split(' ')[0]}!</h1>
        <p className="text-gray-500 mt-1 text-sm">Your beat and targets for today.</p>
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

      <Card className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Orders</h3>
        {todayOrders.length === 0 ? (
          <p className="text-sm text-gray-500">No orders booked today yet.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {todayOrders.slice(0, 5).map((order: any) => (
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
  );
}
