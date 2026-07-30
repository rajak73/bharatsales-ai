import { Bell, Store, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TargetsService } from '@bharatsales/api-client';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../database/db';
import { useAttendance } from '../contexts/AttendanceContext';

function isToday(dateValue: unknown): boolean {
  if (!dateValue) return false;
  const d = new Date(dateValue as string);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

export function HomeScreen() {
  const navigate = useNavigate();
  const { activeSession } = useAttendance();
  const [syncStatus, setSyncStatus] = useState({ isSyncing: false, pendingCount: 0 });

  useEffect(() => {
    const handleSyncStatus = (e: any) => {
      setSyncStatus(e.detail);
    };
    window.addEventListener('sync_status', handleSyncStatus);
    return () => window.removeEventListener('sync_status', handleSyncStatus);
  }, []);

  useEffect(() => {
    const fetchTarget = async () => {
      try {
        const targets = await TargetsService.getTargets();
        let userId = 'unknown';
        try {
          const token = localStorage.getItem('bharatsales_token');
          if (token) {
            const payload = JSON.parse(atob(token.split('.')[1]));
            userId = payload.sub;
          }
        } catch {
          // ignore parsing error
        }

        const myTarget = targets.find(t => t.entityType === 'User' && t.entityId === userId && t.period === 'Daily');
        if (myTarget) {
          setTargetData({
            goal: myTarget.targetValue || 0,
            achieved: myTarget.actualValue || 0,
            percentage: myTarget.targetValue ? Math.round(((myTarget.actualValue || 0) / myTarget.targetValue) * 100) : 0,
            shopsVisited: 0,
            totalShops: 0,
            hasTarget: true
          });
        } else {
          setTargetData(prev => ({ ...prev, hasTarget: false }));
        }
      } catch (err) {
        console.error('Failed to fetch target', err);
      }
    };
    fetchTarget();
  }, []);

  const formatCurrency = (amount: number) => {
    return '₹' + amount.toLocaleString('en-IN');
  };

  const [targetData, setTargetData] = useState({
    goal: 0,
    achieved: 0,
    percentage: 0,
    shopsVisited: 0,
    totalShops: 0,
    hasTarget: false
  });

  const allOutlets = useLiveQuery(() => db.outlets.toArray(), []) ?? [];
  const beatSchedules = useLiveQuery(() => db.beatSchedules.toArray(), []) ?? [];
  const todayBeat = beatSchedules.find(s => isToday((s as any).date)) ?? beatSchedules[0];

  let smartBeatOutlets: any[] = [];
  if (todayBeat && todayBeat.beat && typeof todayBeat.beat !== 'string') {
    const routeOutletIds = (todayBeat.beat as any).outlets.map((o: any) => o._id || o.id);
    smartBeatOutlets = allOutlets
      .filter(o => routeOutletIds.includes(o.id))
      .map(o => ({ ...o, locationText: o.location?.address || 'Unknown' }));
  }
  const beatPreview = smartBeatOutlets.slice(0, 3);

  return (
    <div className="bg-slate-50 min-h-screen font-sans pb-24">
      {/* Top App Bar */}
      <div className="bg-[#2D3A8C] px-5 pt-12 pb-4 flex items-center justify-between shadow-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            {/* Approximating the B with chart arrow logo */}
            <div className="text-[#2D3A8C] font-bold text-lg italic tracking-tighter flex">
              <span className="relative">
                B
                <div className="absolute -top-[2px] -right-[6px] w-2 h-2 border-t border-r border-cyan-400 transform -rotate-45"></div>
              </span>
            </div>
          </div>
          <h1 className="text-white text-xl font-bold tracking-tight">BharatSales AI</h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold backdrop-blur-sm border border-white/30">
            RA
          </div>
          <button className="text-white relative" onClick={() => navigate('/notifications')}>
            <Bell size={22} />
            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 border-2 border-[#2D3A8C] rounded-full"></span>
          </button>
        </div>
      </div>

      {syncStatus.isSyncing && (
        <div className="bg-blue-500 text-white text-xs font-bold px-4 py-2 flex items-center justify-center gap-2">
          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          Syncing {syncStatus.pendingCount} offline {syncStatus.pendingCount === 1 ? 'action' : 'actions'}...
        </div>
      )}

      <div className="px-5 py-6 space-y-6">

        {!activeSession && (
          <div className="bg-yellow-50 text-yellow-700 p-4 rounded-xl text-sm font-medium border border-yellow-200 shadow-sm flex items-start gap-3">
            <div className="mt-0.5">⚠️</div>
            <div>
              <p className="font-bold mb-1">You are Off Duty</p>
              <p>Check in via the Attendance tab to start visiting outlets today.</p>
              <button
                onClick={() => navigate('/attendance')}
                className="mt-3 bg-yellow-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm"
              >
                Go to Attendance
              </button>
            </div>
          </div>
        )}

        {/* Target Progress Card */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-[#1E293B] text-lg font-bold mb-4">Today's Target Progress</h2>

          {!targetData.hasTarget ? (
            <div className="text-center py-4">
              <p className="text-sm font-medium text-gray-500">No target assigned for today.</p>
              <p className="text-xs text-gray-400 mt-1">Please check with your manager.</p>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-end mb-2">
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-0.5">Goal</p>
                  <p className="text-[#1E293B] font-bold">{formatCurrency(targetData.goal)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-0.5">Achieved</p>
                  <p className="text-[#1E293B] font-bold">{formatCurrency(targetData.achieved)}</p>
                </div>
              </div>

              <div className="relative h-6 w-full bg-[#E2E8F0] rounded-full overflow-hidden mb-4 shadow-inner">
                <div
                  className="absolute top-0 left-0 h-full bg-[#2D3A8C] rounded-full transition-all duration-1000 flex items-center justify-end pr-2"
                  style={{ width: `${targetData.percentage}%` }}
                >
                  <span className="text-white text-xs font-bold">{targetData.percentage}%</span>
                </div>
              </div>

              <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs font-medium text-[#64748B]">Status: <span className="text-green-600 font-bold">On Track! Keep going!</span></p>
                <p className="text-xs font-bold text-[#1E293B] bg-slate-100 px-2.5 py-1 rounded-lg">
                  {targetData.shopsVisited}/{targetData.totalShops} Shops Visited
                </p>
              </div>
            </>
          )}
        </div>

        {/* Today's Beat preview */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-[#1E293B] text-xl font-bold">Today's Beat</h2>
            <button onClick={() => navigate('/beat')} className="flex items-center gap-1 text-xs font-bold text-[#2D3A8C]">
              View All <ChevronRight size={14} />
            </button>
          </div>
          <p className="text-[#64748B] text-sm mt-1 mb-4">Retail shops on today's route</p>

          {!activeSession ? null : beatPreview.length === 0 ? (
            <div className="bg-white rounded-2xl p-4 text-center border border-gray-100 shadow-sm">
              <p className="text-sm font-medium text-gray-500">No beat assigned for today.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {beatPreview.map((outlet) => (
                <div key={outlet.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-[#E0E7FF] text-[#2D3A8C]">
                    <Store size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-[#1E293B] truncate">{outlet.name}</h3>
                    <p className="text-xs text-[#64748B] mt-0.5 truncate">{outlet.locationText}</p>
                  </div>
                  <button
                    onClick={() => navigate('/visit', { state: { outlet } })}
                    className="bg-[#E0E7FF] text-[#2D3A8C] font-bold text-xs px-3 py-2 rounded-lg hover:bg-[#C7D2FE] transition-colors shrink-0"
                  >
                    Visit
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
