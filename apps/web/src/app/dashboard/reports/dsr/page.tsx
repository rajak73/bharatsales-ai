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
  const [repBreakdown, setRepBreakdown] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isManager, setIsManager] = useState(false);

  useEffect(() => {
    try {
      const token = localStorage.getItem('bharatsales_token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setIsManager(payload.role === 'Sales Manager');
      }
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    const fetchDSR = async () => {
      try {
        setLoading(true);
        const data = isManager
          ? await PerformanceService.getTeamDSR(date)
          : await PerformanceService.getDSR(date);
        if (data && data.metrics) {
          setMetrics(data.metrics);
        }
        setRepBreakdown(data?.repBreakdown || []);
      } catch (err) {
        console.error('Failed to load DSR:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDSR();
  }, [date, isManager]);

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
          
          {isManager && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Field Rep Performance</h2>
              {repBreakdown.length === 0 ? (
                <div className="text-sm text-gray-500 text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                  No rep activity recorded for this date.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr className="text-left text-gray-500">
                        <th className="px-4 py-2 font-medium">Rep</th>
                        <th className="px-4 py-2 font-medium text-right">Visits</th>
                        <th className="px-4 py-2 font-medium text-right">Productive</th>
                        <th className="px-4 py-2 font-medium text-right">Orders</th>
                        <th className="px-4 py-2 font-medium text-right">Order Value</th>
                        <th className="px-4 py-2 font-medium text-right">Collections</th>
                      </tr>
                    </thead>
                    <tbody>
                      {repBreakdown.map((rep) => (
                        <tr key={rep.userId} className="border-t border-gray-100">
                          <td className="px-4 py-2 font-medium text-gray-900">{rep.name}</td>
                          <td className="px-4 py-2 text-right">{rep.totalVisits}</td>
                          <td className="px-4 py-2 text-right">{rep.productiveVisits}</td>
                          <td className="px-4 py-2 text-right">{rep.ordersCount}</td>
                          <td className="px-4 py-2 text-right">₹{rep.totalOrderValue.toLocaleString()}</td>
                          <td className="px-4 py-2 text-right">₹{rep.totalCollections.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
