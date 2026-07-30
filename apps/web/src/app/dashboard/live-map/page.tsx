'use client';

import { useState, useEffect } from 'react';
import { LiveMapService, BeatsService } from '@bharatsales/api-client';
import { LiveRep } from '@bharatsales/shared-types';
import { Loader2, AlertTriangle } from 'lucide-react';
import dynamic from 'next/dynamic';

const LiveMap = dynamic(() => import('./LiveMapComponent'), {
  ssr: false,
  loading: () => (
    <div className="text-center w-full flex flex-col items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
      <h3 className="text-lg font-bold text-gray-900">Loading Live Map...</h3>
    </div>
  )
});

export default function LiveMapPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [successMessage, setSuccessMessage] = useState('');
  
  const [liveReps, setLiveReps] = useState<LiveRep[]>([]);
  const [loading, setLoading] = useState(true);
  const [deviations, setDeviations] = useState<Record<string, any>>({});
  const [checkingDeviation, setCheckingDeviation] = useState<string | null>(null);

  useEffect(() => {
    fetchData(); // Initial load

    // Setup polling every 5 seconds for real-time updates since EventSource cannot send JWT headers easily
    const intervalId = setInterval(() => {
      fetchData(false);
    }, 5000);

    return () => clearInterval(intervalId);
  }, []);

  const fetchData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const reps = await LiveMapService.getLiveReps();
      setLiveReps(Array.isArray(reps) ? reps : []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const filteredReps = liveReps.filter(rep => {
    const matchesSearch = rep.name.toLowerCase().includes(searchTerm.toLowerCase()) || rep.outlet.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All Status' || rep.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleRefresh = async () => {
    setSuccessMessage('Location data refreshed!');
    await fetchData();
    setTimeout(() => setSuccessMessage(''), 2000);
  };

  const handleCheckDeviation = async (repId: string) => {
    setCheckingDeviation(repId);
    try {
      const result = await BeatsService.checkRouteDeviation(repId);
      setDeviations(prev => ({ ...prev, [repId]: result }));
    } catch (error) {
      console.error('Failed to check route deviation:', error);
    } finally {
      setCheckingDeviation(null);
    }
  };

  return (
    <div className="space-y-6">
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2"><span className="text-green-600">✅</span><span className="text-sm text-green-800 font-medium">{successMessage}</span></div>
          <button onClick={() => setSuccessMessage('')} className="text-green-600 hover:text-green-800">✕</button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Live Team Tracking</h1><p className="text-gray-500">Live Map View • Real-time field team locations • {liveReps.length} reps active</p></div>
        <div className="flex items-center space-x-3">
          <span className="flex items-center space-x-2 text-sm text-green-600"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span><span>{liveReps.length} reps active</span></span>
          <button onClick={handleRefresh} className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">🔄 Refresh</button>
        </div>
      </div>

      <div className="card">
        <div className="flex flex-wrap gap-4">
          <input type="text" placeholder="Search reps..." className="input-field w-64" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          <select className="input-field w-40" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option>All Status</option><option>At Outlet</option><option>Traveling</option><option>On Break</option><option>Offline</option></select>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Real Live Map */}
        <div className="lg:col-span-2 card min-h-[500px] flex flex-col relative z-0 p-0 overflow-hidden">
          <LiveMap reps={filteredReps} />
        </div>

        {/* Team List */}
        <div className="space-y-4">
          <h3 className="font-bold text-gray-900">Active Representatives</h3>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
          ) : filteredReps.length > 0 ? (
            filteredReps.map((rep) => (
              <div key={rep.id || rep.name} className="card">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${rep.status === 'At Outlet' ? 'bg-green-500' : rep.status === 'Traveling' ? 'bg-blue-500' : rep.status === 'Offline' ? 'bg-gray-400' : 'bg-yellow-500'}`}></div>
                    <span className="font-medium text-gray-900">{rep.name}</span>
                  </div>
                  <span className="text-xs text-gray-400">{rep.lastUpdate}</span>
                </div>
                <div className="text-sm text-gray-500 mb-2">{rep.outlet}</div>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-medium ${rep.status === 'At Outlet' ? 'text-green-600' : rep.status === 'Traveling' ? 'text-blue-600' : rep.status === 'Offline' ? 'text-gray-600' : 'text-yellow-600'}`}>{rep.status}</span>
                  <span className="text-xs text-gray-400">🔋 {rep.battery}%</span>
                </div>

                {deviations[rep.id] ? (
                  deviations[rep.id].hasPlan && (deviations[rep.id].deviations.skippedOutlets.length > 0 || deviations[rep.id].deviations.outOfSequenceOutlets.length > 0) ? (
                    <div className="mt-2 flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                      <span>
                        {deviations[rep.id].deviations.skippedOutlets.length > 0 && `${deviations[rep.id].deviations.skippedOutlets.length} outlet(s) skipped. `}
                        {deviations[rep.id].deviations.outOfSequenceOutlets.length > 0 && `${deviations[rep.id].deviations.outOfSequenceOutlets.length} out of sequence.`}
                      </span>
                    </div>
                  ) : (
                    <div className="mt-2 text-xs text-green-600">On planned route.</div>
                  )
                ) : (
                  <button
                    onClick={() => handleCheckDeviation(rep.id)}
                    disabled={checkingDeviation === rep.id}
                    className="mt-2 text-xs text-primary-600 hover:text-primary-700 font-medium disabled:opacity-50"
                  >
                    {checkingDeviation === rep.id ? 'Checking route...' : 'Check route deviation'}
                  </button>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">No active representatives found.</div>
          )}
        </div>
      </div>
    </div>
  );
}
