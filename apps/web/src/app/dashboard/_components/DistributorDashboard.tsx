'use client';

import { useEffect, useState } from 'react';
import { AnalyticsService } from '@bharatsales/api-client';
import { Loader2, Truck, Boxes, IndianRupee, PackageCheck } from 'lucide-react';
import { Card } from '@bharatsales/ui';

export function DistributorDashboard({ userName }: { userName: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AnalyticsService.getDashboardData()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const tiles = [
    { label: 'Pending Deliveries', value: kpis.pendingDeliveries ?? 0, icon: <Truck className="w-5 h-5" /> },
    { label: 'In Transit', value: kpis.inTransit ?? 0, icon: <PackageCheck className="w-5 h-5" /> },
    { label: 'Outstanding Receivables', value: `₹${(kpis.outstandingReceivables ?? 0).toLocaleString('en-IN')}`, icon: <IndianRupee className="w-5 h-5" /> },
    { label: 'Stock Units on Hand', value: kpis.totalStockValue ?? 0, icon: <Boxes className="w-5 h-5" /> },
  ];

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Welcome back, {userName.split(' ')[0]}!
        </h1>
        <p className="text-gray-500 mt-1 text-sm">Your fulfilment overview for today.</p>
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
        {(data?.recentOrders || []).length === 0 ? (
          <p className="text-sm text-gray-500">No orders yet.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {data.recentOrders.map((order: any) => (
              <div key={order._id || order.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{order.orderNumber}</p>
                  <p className="text-xs text-gray-500">{order.status}</p>
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
