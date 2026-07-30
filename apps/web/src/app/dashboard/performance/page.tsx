'use client';

import { useState, useEffect } from 'react';
import { PerformanceService, UsersService } from '@bharatsales/api-client';
import { Loader2, Trophy } from 'lucide-react';

export default function PerformancePage() {
  const [targets, setTargets] = useState<any[]>([]);
  const [repNames, setRepNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [targetData, users] = await Promise.all([
        PerformanceService.getTeamTargets(),
        UsersService.getUsers(),
      ]);
      setTargets(targetData || []);
      const nameMap: Record<string, string> = {};
      (users || []).forEach(u => { nameMap[u.id] = u.name; });
      setRepNames(nameMap);
    } catch (error) {
      console.error('Failed to fetch team performance:', error);
    } finally {
      setLoading(false);
    }
  };

  const ranked = [...targets].sort((a, b) => (b.meta?.achievementPercentage ?? 0) - (a.meta?.achievementPercentage ?? 0));

  const statusColor = (status: string) => {
    if (status === 'Achieved') return 'bg-green-100 text-green-700';
    if (status === 'At Risk') return 'bg-red-100 text-red-700';
    if (status === 'Missed') return 'bg-gray-100 text-gray-600';
    return 'bg-blue-100 text-blue-700';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Team Performance</h1>
        <p className="text-gray-500">Target vs achievement scorecards for your team.</p>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : ranked.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-500">
          No targets assigned to your team yet.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {ranked.map((target, idx) => (
            <div key={target.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {idx === 0 && <Trophy className="w-4 h-4 text-amber-500" />}
                  <span className="font-bold text-gray-900">{repNames[target.entityId] || target.entityId}</span>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColor(target.status)}`}>
                  {target.status}
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-2">{target.targetMetric || 'SalesValue'}</p>
              <div className="relative h-3 w-full bg-gray-100 rounded-full overflow-hidden mb-2">
                <div
                  className="absolute top-0 left-0 h-full bg-primary-600 rounded-full"
                  style={{ width: `${Math.min(100, target.meta?.achievementPercentage ?? 0)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{Math.round(target.meta?.achievementPercentage ?? 0)}% achieved</span>
                <span className="font-medium text-gray-900">{target.actualValue?.toLocaleString?.() ?? 0} / {target.targetValue?.toLocaleString?.() ?? 0}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
