import { useAttendance } from '../contexts/AttendanceContext';
import { ShoppingCart, Target, MapPin, Clock, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { SyncEngine } from '../sync/syncEngine';
import { TargetsService } from '@bharatsales/api-client';
import type { SalesTarget } from '@bharatsales/shared-types';

export function HomeScreen() {
  const { activeSession } = useAttendance();
  const navigate = useNavigate();
  const [isSyncing, setIsSyncing] = useState(false);
  const [target, setTarget] = useState<SalesTarget | null>(null);

  useEffect(() => {
    const fetchTarget = async () => {
      try {
        const targets = await TargetsService.getTargets();
        
        // Extract userId from JWT
        let userId = 'unknown';
        try {
          const token = localStorage.getItem('bharatsales_token');
          if (token) {
            const payload = JSON.parse(atob(token.split('.')[1]));
            userId = payload.sub;
          }
        } catch (e) {}

        const myTarget = targets.find(t => t.entityType === 'User' && t.entityId === userId && t.period === 'Monthly');
        if (myTarget) setTarget(myTarget);
      } catch (err) {
        console.error('Failed to fetch target', err);
      }
    };
    fetchTarget();
  }, []);

  const formatCurrency = (amount: number) => {
    if (amount >= 100000) return '₹' + (amount / 100000).toFixed(1) + 'L';
    return '₹' + amount.toLocaleString();
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await SyncEngine.pullSync();
      await SyncEngine.triggerSync();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="pb-20 bg-gray-50 min-h-screen">
      {/* Header Profile Section */}
      <div className="bg-blue-600 px-6 pt-12 pb-8 text-white shadow-md rounded-b-3xl">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Hello, Sales Rep 👋</h1>
            <p className="opacity-90 mt-1">Ready for a great day?</p>
          </div>
          <button 
            onClick={handleSync}
            disabled={isSyncing}
            className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center font-bold text-lg backdrop-blur-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="px-6 -mt-4 relative z-10 space-y-6">
        
        {/* Attendance Banner */}
        {!activeSession ? (
          <div 
            onClick={() => navigate('/attendance')}
            className="bg-red-50 rounded-2xl p-5 shadow-sm border border-red-100 flex items-center gap-4 cursor-pointer"
          >
            <div className="bg-red-100 p-3 rounded-full text-red-600">
              <Clock className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-red-900">Start Your Day</h3>
              <p className="text-sm text-red-700">You need to mark attendance before visiting outlets.</p>
            </div>
          </div>
        ) : (
          <div 
            onClick={() => navigate('/attendance')}
            className="bg-green-50 rounded-2xl p-5 shadow-sm border border-green-100 flex items-center gap-4 cursor-pointer"
          >
            <div className="bg-green-100 p-3 rounded-full text-green-600">
              <Clock className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-green-900">You're On Duty</h3>
              <p className="text-sm text-green-700">Started at {new Date(activeSession.startTime).toLocaleTimeString()}</p>
            </div>
          </div>
        )}

        {/* Action Grid */}
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => activeSession ? navigate('/outlets') : navigate('/attendance')}
            className={`p-5 rounded-2xl shadow-sm border text-left transition-transform active:scale-[0.98] ${
              activeSession ? 'bg-white border-gray-100 hover:border-blue-200' : 'bg-gray-100 border-gray-200 opacity-60'
            }`}
          >
            <MapPin className={`w-8 h-8 mb-3 ${activeSession ? 'text-blue-500' : 'text-gray-400'}`} />
            <h3 className="font-bold text-gray-900 text-lg">My Route</h3>
            <p className="text-xs text-gray-500 mt-1">24 Outlets Today</p>
          </button>
          
          <button 
            onClick={() => activeSession ? navigate('/catalog') : navigate('/attendance')}
            className={`p-5 rounded-2xl shadow-sm border text-left transition-transform active:scale-[0.98] ${
              activeSession ? 'bg-white border-gray-100 hover:border-green-200' : 'bg-gray-100 border-gray-200 opacity-60'
            }`}
          >
            <ShoppingCart className={`w-8 h-8 mb-3 ${activeSession ? 'text-green-500' : 'text-gray-400'}`} />
            <h3 className="font-bold text-gray-900 text-lg">New Order</h3>
            <p className="text-xs text-gray-500 mt-1">Browse Catalog</p>
          </button>
        </div>

        {/* Dashboard Cards */}
        {target ? (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-500" />
                Monthly Target
              </h3>
              <span className="text-sm font-bold text-indigo-600">
                {Math.min(100, Math.round((target.actualValue / target.targetValue) * 100))}%
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5 mb-2">
              <div 
                className="bg-indigo-600 h-2.5 rounded-full transition-all duration-1000" 
                style={{ width: `${Math.min(100, Math.round((target.actualValue / target.targetValue) * 100))}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 flex justify-between">
              <span>{formatCurrency(target.actualValue)} Achieved</span>
              <span>{formatCurrency(target.targetValue)} Target</span>
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-center text-sm text-gray-500">
            No active targets found for this month.
          </div>
        )}

      </div>
    </div>
  );
}
