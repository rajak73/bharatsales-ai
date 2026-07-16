'use client';

import { useState, useEffect } from 'react';
import { BeatsService } from '@bharatsales/api-client';
import type { Beat } from '@bharatsales/shared-types';
import { Loader2 } from 'lucide-react';

export default function BeatsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [dayFilter, setDayFilter] = useState('All Days');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [newBeat, setNewBeat] = useState({ name: '', day: '', outlets: 0, rep: '', distributor: '' });
  const [allBeats, setAllBeats] = useState<Beat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBeats();
  }, []);

  const fetchBeats = async () => {
    try {
      setLoading(true);
      const data = await BeatsService.getBeats('org-1');
      setAllBeats(data || []);
    } catch (error) {
      console.error('Failed to fetch beats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter beats
  const filteredBeats = allBeats.filter(beat => {
    const matchesSearch = beat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          beat.rep.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDay = dayFilter === 'All Days' || beat.day === dayFilter;
    return matchesSearch && matchesDay;
  });

  const handleCreateBeat = async () => {
    if (newBeat.name && newBeat.day && newBeat.rep) {
      try {
        await BeatsService.createBeat({
          name: newBeat.name,
          day: newBeat.day,
          rep: newBeat.rep,
          outlets: Number(newBeat.outlets),
          status: 'Published',
          organizationId: 'org-1'
        });
        setSuccessMessage(`Beat "${newBeat.name}" created successfully!`);
        setShowCreateModal(false);
        setNewBeat({ name: '', day: '', outlets: 0, rep: '', distributor: '' });
        fetchBeats();
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (err) {
        console.error('Failed to create beat', err);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-green-600">✅</span>
            <span className="text-sm text-green-800 font-medium">{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage('')} className="text-green-600 hover:text-green-800">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Beat Planning</h1>
          <p className="text-gray-500">Create and manage beat plans • {filteredBeats.length} beats</p>
        </div>
        <div className="flex space-x-3">
          <select
            className="input-field w-32 text-sm"
            value={dayFilter}
            onChange={(e) => setDayFilter(e.target.value)}
          >
            <option>All Days</option>
            <option>Monday</option>
            <option>Tuesday</option>
            <option>Wednesday</option>
            <option>Thursday</option>
            <option>Friday</option>
            <option>Saturday</option>
          </select>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary text-sm">+ Create Beat</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card text-center">
          <div className="text-2xl font-bold text-gray-900">{allBeats.length}</div>
          <div className="text-sm text-gray-500">Total Beats</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-600">{allBeats.filter(b => b.status === 'Published').length}</div>
          <div className="text-sm text-gray-500">Published</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-yellow-600">{allBeats.filter(b => b.status === 'Draft').length}</div>
          <div className="text-sm text-gray-500">Draft</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-primary-600">{allBeats.length ? Math.round(allBeats.reduce((sum, b) => sum + (b.visited / (b.assigned || 1) * 100), 0) / allBeats.length) : 0}%</div>
          <div className="text-sm text-gray-500">Avg Compliance</div>
        </div>
      </div>

      {/* Search */}
      <div className="card">
        <input
          type="text"
          placeholder="Search beats..."
          className="input-field w-full max-w-md"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Beat List */}
      <div className="grid md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 card flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : filteredBeats.length > 0 ? (
          filteredBeats.map((beat) => (
            <div key={beat.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-gray-900">{beat.name}</span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                  beat.status === 'Published' ? 'bg-green-100 text-green-700' :
                  beat.status === 'Draft' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {beat.status}
                </span>
              </div>
              <div className="text-xs text-gray-500 mb-3">{beat.day} • {beat.rep}</div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">{beat.outlets} outlets</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div className="bg-primary-500 h-2 rounded-full" style={{width: `${(beat.visited / (beat.assigned || 1)) * 100}%`}}></div>
                  </div>
                  <span className="text-xs font-medium">{beat.visited}/{beat.assigned}</span>
                </div>
              </div>
              <div className="flex space-x-2 mt-4 pt-4 border-t border-gray-100">
                <button className="flex-1 text-center text-sm text-primary-600 hover:text-primary-700 font-medium">View</button>
                <button className="flex-1 text-center text-sm text-gray-500 hover:text-gray-700">Edit</button>
                <button className="flex-1 text-center text-sm text-gray-500 hover:text-gray-700">Publish</button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-2 card text-center py-12">
            <div className="text-4xl mb-2">🎯</div>
            <p className="text-gray-500">No beats found</p>
          </div>
        )}
      </div>

      {/* Create Beat Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Create Beat</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Beat Name *</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Enter beat name"
                  value={newBeat.name}
                  onChange={(e) => setNewBeat({ ...newBeat, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Day *</label>
                <select
                  className="input-field"
                  value={newBeat.day}
                  onChange={(e) => setNewBeat({ ...newBeat, day: e.target.value })}
                >
                  <option value="">Select day</option>
                  <option>Monday</option>
                  <option>Tuesday</option>
                  <option>Wednesday</option>
                  <option>Thursday</option>
                  <option>Friday</option>
                  <option>Saturday</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sales Rep *</label>
                <select
                  className="input-field"
                  value={newBeat.rep}
                  onChange={(e) => setNewBeat({ ...newBeat, rep: e.target.value })}
                >
                  <option value="">Select rep</option>
                  <option>Amit Singh</option>
                  <option>Priya Patel</option>
                  <option>Rajesh Kumar</option>
                  <option>Vikram Joshi</option>
                  <option>Sneha Reddy</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Number of Outlets</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="0"
                  value={newBeat.outlets}
                  onChange={(e) => setNewBeat({ ...newBeat, outlets: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button onClick={() => setShowCreateModal(false)} className="flex-1 btn-secondary">Cancel</button>
              <button
                onClick={handleCreateBeat}
                disabled={!newBeat.name || !newBeat.day || !newBeat.rep}
                className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Beat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
