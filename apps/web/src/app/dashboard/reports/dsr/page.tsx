'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Users, Target, IndianRupee, MapPin } from 'lucide-react';
import { PerformanceService } from '@bharatsales/api-client';

export default function DSRPage() {
  const [metrics, setMetrics] = useState({
    totalVisits: 0,
    productiveVisits: 0,
    totalOrderValue: 0,
    totalCollections: 0,
    ordersCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const fetchDSR = async () => {
      try {
        setLoading(true);
        const data = await PerformanceService.getDSR(date);
        if (data && data.metrics) {
          setMetrics(data.metrics);
        }
      } catch (err) {
        console.error('Failed to load DSR:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDSR();
  }, [date]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Daily Sales Report (DSR)</h1>
          <p className="text-gray-500">Track field performance and daily metrics.</p>
        </div>
        <div className="flex items-center space-x-3">
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:ring-primary-500 focus:border-primary-500"
          />
          <button className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">
            Export PDF
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <p className="text-gray-500">Loading DSR metrics...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col">
              <div className="flex items-center gap-3 mb-4 text-blue-600">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <MapPin className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-gray-900">Coverage</h3>
              </div>
              <div className="mt-auto">
                <div className="text-3xl font-bold text-gray-900">{metrics.totalVisits}</div>
                <div className="text-sm text-gray-500">Total Visits Today</div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col">
              <div className="flex items-center gap-3 mb-4 text-green-600">
                <div className="p-3 bg-green-50 rounded-lg">
                  <Target className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-gray-900">Productivity</h3>
              </div>
              <div className="mt-auto">
                <div className="text-3xl font-bold text-gray-900">
                  {Math.round((metrics.productiveVisits / metrics.totalVisits) * 100 || 0)}%
                </div>
                <div className="text-sm text-gray-500">{metrics.productiveVisits} Productive Visits</div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col">
              <div className="flex items-center gap-3 mb-4 text-purple-600">
                <div className="p-3 bg-purple-50 rounded-lg">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-gray-900">Order Value</h3>
              </div>
              <div className="mt-auto">
                <div className="text-3xl font-bold text-gray-900">₹{metrics.totalOrderValue.toLocaleString()}</div>
                <div className="text-sm text-gray-500">Across {metrics.ordersCount} Orders</div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col">
              <div className="flex items-center gap-3 mb-4 text-orange-600">
                <div className="p-3 bg-orange-50 rounded-lg">
                  <IndianRupee className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-gray-900">Collections</h3>
              </div>
              <div className="mt-auto">
                <div className="text-3xl font-bold text-gray-900">₹{metrics.totalCollections.toLocaleString()}</div>
                <div className="text-sm text-gray-500">Total Collected Today</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Field Rep Performance</h2>
            <div className="text-sm text-gray-500 text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
              Breakdown by Sales Rep will be rendered here.
            </div>
          </div>
        </>
      )}
    </div>
  );
}
