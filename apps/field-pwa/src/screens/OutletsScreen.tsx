import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../database/db';
import { MapPin, Search, ChevronRight, Route } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// unused import removed

export function OutletsScreen() {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'all' | 'route'>('route');
  const navigate = useNavigate();
  
  const outlets = useLiveQuery(() => db.outlets.toArray(), []) ?? [];
  const beatSchedules = useLiveQuery(() => db.beatSchedules.toArray(), []) ?? [];
  const todayBeat = beatSchedules[0];

  let displayOutlets = outlets;
  
  if (viewMode === 'route' && todayBeat && todayBeat.beat && typeof todayBeat.beat !== 'string') {
    // Assuming beat is populated with outlets
    const routeOutletIds = (todayBeat.beat as any).outlets.map((o: any) => o._id || o.id);
    displayOutlets = outlets.filter(o => routeOutletIds.includes(o.id));
  }

  const filteredOutlets = displayOutlets.filter(o => o.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-4 space-y-4 pb-24">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-2xl font-bold text-gray-900">My Outlets</h1>
        <span className="bg-primary-100 text-primary-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
          {displayOutlets.length} total
        </span>
      </div>

      <div className="flex bg-gray-100 p-1 rounded-xl">
        <button
          onClick={() => setViewMode('route')}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
            viewMode === 'route' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'
          }`}
        >
          <Route className="w-4 h-4" /> Today's Route
        </button>
        <button
          onClick={() => setViewMode('all')}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
            viewMode === 'all' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'
          }`}
        >
          <MapPin className="w-4 h-4" /> All Outlets
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search outlets..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 w-full rounded-xl border-gray-200 focus:border-primary-500 focus:ring-primary-500 text-sm h-10 border bg-white shadow-sm"
        />
      </div>

      {displayOutlets.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
          <Route className="mx-auto h-12 w-12 text-gray-300 mb-2" />
          <h3 className="text-sm font-semibold text-gray-900">No route assigned</h3>
          <p className="text-sm text-gray-500">You don't have any outlets assigned to your route today. Switch to 'All Outlets' to see your territory.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOutlets.map((outlet) => (
            <div 
              key={outlet.id} 
              onClick={() => navigate('/visit', { state: { outlet } })}
              className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center cursor-pointer hover:border-primary-200 transition-colors"
            >
              <div>
                <h3 className="font-semibold text-gray-900">{outlet.name}</h3>
                <div className="flex items-center text-xs text-gray-500 mt-1">
                  <MapPin className="w-3 h-3 mr-1" />
                  {outlet.location?.latitude?.toFixed(4) || 'N/A'}, {outlet.location?.longitude?.toFixed(4) || 'N/A'}
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300 self-center" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
