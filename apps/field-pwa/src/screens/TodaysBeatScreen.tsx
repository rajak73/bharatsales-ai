import { Store, CheckCircle, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../database/db';
import { useAttendance } from '../contexts/AttendanceContext';

function isToday(dateValue: unknown): boolean {
  if (!dateValue) return false;
  const d = new Date(dateValue as string);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

export function TodaysBeatScreen() {
  const navigate = useNavigate();
  const { activeSession } = useAttendance();

  const allOutlets = useLiveQuery(() => db.outlets.toArray(), []) ?? [];
  const beatSchedules = useLiveQuery(() => db.beatSchedules.toArray(), []) ?? [];
  const todayBeat = beatSchedules.find(s => isToday((s as any).date)) ?? beatSchedules[0];

  let smartBeatOutlets: any[] = [];
  if (todayBeat && todayBeat.beat && typeof todayBeat.beat !== 'string') {
    const routeOutletIds = (todayBeat.beat as any).outlets.map((o: any) => o._id || o.id);
    smartBeatOutlets = allOutlets
      .filter(o => routeOutletIds.includes(o.id))
      .map(o => ({ ...o, visitStatus: 'upcoming', locationText: o.location?.address || 'Unknown' }));
  }

  return (
    <div className="bg-slate-50 min-h-screen font-sans pb-24">
      <div className="bg-primary-600 px-5 pt-12 pb-6 shadow-md sticky top-0 z-40">
        <h1 className="text-white text-xl font-bold tracking-tight">Today's Beat</h1>
        <p className="text-white/80 text-sm mt-1">Retail shops on today's route</p>
      </div>

      <div className="px-5 py-6 space-y-3">
        <button
          onClick={() => navigate('/outlets')}
          className="w-full text-center text-xs font-bold text-primary-600 bg-primary-100 px-4 py-2 rounded-lg mb-2"
        >
          Browse All Outlets
        </button>

        {!activeSession ? (
          <div className="bg-yellow-50 text-yellow-700 p-4 rounded-xl text-sm font-medium border border-yellow-200 shadow-sm flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <div>
              <p className="font-bold mb-1">You are Off Duty</p>
              <p>Please check in via the Attendance tab to view your beat and start visiting outlets.</p>
              <button
                onClick={() => navigate('/attendance')}
                className="mt-3 bg-yellow-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm"
              >
                Go to Attendance
              </button>
            </div>
          </div>
        ) : smartBeatOutlets.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center border border-gray-100 shadow-sm">
            <p className="text-sm font-medium text-gray-500">No beat assigned for today.</p>
          </div>
        ) : (
          smartBeatOutlets.map((outlet) => (
            <div key={outlet.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 relative overflow-hidden">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-primary-100 text-primary-600">
                  <Store size={20} />
                </div>
                <div className="flex-1 min-w-0 pr-16">
                  <h3 className="font-bold text-slate-800 truncate pr-2">{outlet.name}</h3>
                  {outlet.visitStatus === 'visited' ? (
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-slate-500">Visited</p>
                      <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                    </div>
                  ) : (
                    <>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">{outlet.locationText}</p>
                      <button
                        onClick={() => navigate('/visit', { state: { outlet } })}
                        className="mt-3 bg-primary-100 text-primary-600 font-bold text-xs px-4 py-2 rounded-lg hover:bg-primary-200 transition-colors"
                      >
                        Visit Now
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
