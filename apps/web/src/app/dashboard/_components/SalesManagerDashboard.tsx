'use client';

import { useEffect, useState } from 'react';
import { BeatsService, PerformanceService } from '@bharatsales/api-client';
import { Loader2, Target, MapPin, Users, IndianRupee } from 'lucide-react';
import { Card } from '@bharatsales/ui';

export function SalesManagerDashboard({ userName }: { userName: string }) {
  const [beatCompletion, setBeatCompletion] = useState<any>(null);
  const [teamDSR, setTeamDSR] = useState<any>(null);
  const [teamTargets, setTeamTargets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    Promise.all([
      BeatsService.getTeamBeatCompletion().catch(() => null),
      PerformanceService.getTeamDSR(today).catch(() => null),
      PerformanceService.getTeamTargets().catch(() => []),
    ])
      .then(([beat, dsr, targets]) => {
        setBeatCompletion(beat);
        setTeamDSR(dsr);
        setTeamTargets(targets || []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  const totalTarget = teamTargets.reduce((sum, t) => sum + (t.targetValue || 0), 0);
  const totalActual = teamTargets.reduce((sum, t) => sum + (t.actualValue || 0), 0);
  const achievementPct = totalTarget > 0 ? Math.round((totalActual / totalTarget) * 100) : 0;

  const tiles = [
    { label: "Today's Team Visits", value: teamDSR?.metrics?.totalVisits ?? 0, icon: <Users className="w-5 h-5" /> },
    { label: 'Team Beat Completion', value: `${beatCompletion?.teamCompletionPercentage ?? 0}%`, icon: <MapPin className="w-5 h-5" /> },
    { label: "Today's Team Sales", value: `₹${(teamDSR?.metrics?.totalOrderValue ?? 0).toLocaleString('en-IN')}`, icon: <IndianRupee className="w-5 h-5" /> },
    { label: 'Team Target Achievement', value: `${achievementPct}%`, icon: <Target className="w-5 h-5" /> },
  ];

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Welcome back, {userName.split(' ')[0]}!</h1>
        <p className="text-gray-500 mt-1 text-sm">Your team's field activity for today.</p>
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
        <h3 className="text-lg font-bold text-gray-900 mb-4">Rep Beat Completion Today</h3>
        {(beatCompletion?.reps || []).length === 0 ? (
          <p className="text-sm text-gray-500">No reps with a beat scheduled today.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {beatCompletion.reps.map((rep: any) => (
              <div key={rep.userId} className="py-3 flex items-center justify-between">
                <p className="text-sm font-medium text-gray-900">{rep.name}</p>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="h-2 rounded-full bg-primary-600" style={{ width: `${Math.min(100, rep.completionPercentage)}%` }}></div>
                  </div>
                  <span className="text-xs font-medium text-gray-500 w-10 text-right">{rep.completionPercentage}%</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
