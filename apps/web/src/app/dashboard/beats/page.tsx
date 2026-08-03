'use client';

import { useState, useEffect } from 'react';
import { BeatsService, UsersService, OutletsService } from '@bharatsales/api-client';
import type { Beat, User, Outlet } from '@bharatsales/shared-types';
import { Loader2, CheckCircle, X, Target } from 'lucide-react';

function outletId(o: string | { id: string; name: string }): string {
  return typeof o === 'string' ? o : o.id;
}

function outletLabel(o: string | { id: string; name: string }, outlets: Outlet[]): string {
  if (typeof o !== 'string') return o.name;
  return outlets.find(x => x.id === o)?.name || o;
}

export default function BeatsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [newBeat, setNewBeat] = useState<{ name: string; description: string; outletIds: string[] }>({ name: '', description: '', outletIds: [] });
  const [allBeats, setAllBeats] = useState<Beat[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [salesReps, setSalesReps] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ role: string } | null>(null);
  // Beat *templates* are Organization Admin's job (create/edit/publish); a
  // Sales Manager may only assign an already-published template to a rep.
  const canManageTemplates = user?.role === 'Organization Admin' || user?.role === 'Super Admin';
  const canAssign = canManageTemplates || user?.role === 'Sales Manager';
  const [viewingBeat, setViewingBeat] = useState<Beat | null>(null);
  const [editingBeat, setEditingBeat] = useState<Beat | null>(null);
  const [assigningBeat, setAssigningBeat] = useState<Beat | null>(null);
  const [assignForm, setAssignForm] = useState({ userId: '', date: '' });
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    fetchBeats();
    fetchUsers();
    fetchOutlets();

    try {
      const token = localStorage.getItem('bharatsales_token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({ role: payload.role });
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const fetchBeats = async () => {
    try {
      setLoading(true);
      const data = await BeatsService.getBeats();
      setAllBeats(data || []);
    } catch (error) {
      console.error('Failed to fetch beats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const users = await UsersService.getUsers();
      setSalesReps(users.filter(u => u.role === 'Sales Representative'));
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const fetchOutlets = async () => {
    try {
      const data = await OutletsService.getOutlets();
      setOutlets(data || []);
    } catch (error) {
      console.error('Failed to fetch outlets:', error);
    }
  };

  const filteredBeats = allBeats.filter(beat => {
    const matchesSearch = beat.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All Statuses' || beat.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const resetForm = () => setNewBeat({ name: '', description: '', outletIds: [] });

  const handleCreateBeat = async () => {
    if (!newBeat.name) return;
    try {
      await BeatsService.createBeat({
        name: newBeat.name,
        description: newBeat.description || undefined,
        outlets: newBeat.outletIds,
      });
      setSuccessMessage(`Beat template "${newBeat.name}" created as Draft.`);
      setShowCreateModal(false);
      resetForm();
      fetchBeats();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Failed to create beat', err);
      setActionError('Failed to create beat template.');
    }
  };

  const openEditModal = (beat: Beat) => {
    setEditingBeat(beat);
    setNewBeat({
      name: beat.name,
      description: beat.description || '',
      outletIds: beat.outlets.map(outletId),
    });
  };

  const handleUpdateBeat = async () => {
    if (!editingBeat || !newBeat.name) return;
    setActionError('');
    try {
      await BeatsService.updateBeat(editingBeat.id, {
        name: newBeat.name,
        description: newBeat.description || undefined,
        outlets: newBeat.outletIds,
      } as any);
      setSuccessMessage(`Beat template "${newBeat.name}" updated successfully!`);
      setEditingBeat(null);
      resetForm();
      fetchBeats();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Failed to update beat', err);
      setActionError('Failed to update beat template.');
    }
  };

  const handlePublish = async (beat: Beat) => {
    setPublishingId(beat.id);
    setActionError('');
    try {
      await BeatsService.publishBeat(beat.id);
      setSuccessMessage(`Beat "${beat.name}" published!`);
      fetchBeats();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Failed to publish beat', err);
      setActionError('Failed to publish beat.');
    } finally {
      setPublishingId(null);
    }
  };

  const openAssignModal = (beat: Beat) => {
    setAssigningBeat(beat);
    setAssignForm({ userId: '', date: new Date().toISOString().slice(0, 10) });
  };

  const handleAssign = async () => {
    if (!assigningBeat || !assignForm.userId || !assignForm.date) return;
    setAssigning(true);
    setActionError('');
    try {
      await BeatsService.assignBeat(assigningBeat.id, assignForm.userId, assignForm.date);
      setSuccessMessage(`"${assigningBeat.name}" assigned successfully!`);
      setAssigningBeat(null);
      fetchBeats();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error('Failed to assign beat', err);
      setActionError(err?.response?.data?.message || 'Failed to assign beat.');
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="space-y-6">
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-800 font-medium">{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage('')} className="text-green-600 hover:text-green-800"><X className="w-4 h-4" /></button>
        </div>
      )}

      {actionError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
          <span className="text-sm text-red-700 font-medium">{actionError}</span>
          <button onClick={() => setActionError('')} className="text-red-600 hover:text-red-800"><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Beat Planning</h1>
          <p className="text-gray-500">Beat templates & assignments • {filteredBeats.length} beats</p>
        </div>
        <div className="flex space-x-3">
          <select
            className="input-field w-36 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option>All Statuses</option>
            <option>Draft</option>
            <option>Active</option>
            <option>Archived</option>
          </select>
          {canManageTemplates && (
            <button onClick={() => setShowCreateModal(true)} className="btn-primary text-sm">+ Create Beat Template</button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card text-center">
          <div className="text-2xl font-bold text-gray-900">{allBeats.length}</div>
          <div className="text-sm text-gray-500">Total Templates</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-600">{allBeats.filter(b => b.status === 'Active').length}</div>
          <div className="text-sm text-gray-500">Published (Active)</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-yellow-600">{allBeats.filter(b => b.status === 'Draft').length}</div>
          <div className="text-sm text-gray-500">Draft</div>
        </div>
      </div>

      <div className="card">
        <input
          type="text"
          placeholder="Search beats..."
          className="input-field w-full max-w-md"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

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
                  beat.status === 'Active' ? 'bg-green-100 text-green-700' :
                  beat.status === 'Draft' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {beat.status}
                </span>
              </div>
              {beat.description && <div className="text-xs text-gray-500 mb-2">{beat.description}</div>}
              <div className="text-xs text-gray-500 mb-3">{beat.outlets.length} outlets in route</div>
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
                <button onClick={() => setViewingBeat(beat)} className="text-sm text-primary-600 hover:text-primary-700 font-medium">View</button>
                {canManageTemplates && (
                  <>
                    <button onClick={() => openEditModal(beat)} className="text-sm text-gray-500 hover:text-gray-700">Edit</button>
                    <button
                      onClick={() => handlePublish(beat)}
                      disabled={beat.status !== 'Draft' || publishingId === beat.id}
                      className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {publishingId === beat.id ? 'Publishing...' : 'Publish'}
                    </button>
                  </>
                )}
                {canAssign && (
                  <button
                    onClick={() => openAssignModal(beat)}
                    disabled={beat.status !== 'Active'}
                    className="text-sm font-medium text-primary-600 hover:text-primary-700 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Assign to Rep
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-2 card text-center py-12">
            <Target className="w-10 h-10 mx-auto mb-2 opacity-40 text-gray-400" />
            <p className="text-gray-500">No beats found</p>
          </div>
        )}
      </div>

      {/* Create / Edit Beat Template Modal */}
      {(showCreateModal || editingBeat) && canManageTemplates && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">{editingBeat ? 'Edit Beat Template' : 'Create Beat Template'}</h3>
              <button
                onClick={() => { setShowCreateModal(false); setEditingBeat(null); resetForm(); }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Optional description"
                  value={newBeat.description}
                  onChange={(e) => setNewBeat({ ...newBeat, description: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Outlets in Route</label>
                <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto divide-y divide-gray-100">
                  {outlets.length === 0 && (
                    <div className="text-sm text-gray-400 p-3">No outlets found</div>
                  )}
                  {outlets.map(o => (
                    <label key={o.id} className="flex items-center gap-2 p-2.5 text-sm hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newBeat.outletIds.includes(o.id)}
                        onChange={(e) => {
                          setNewBeat(prev => ({
                            ...prev,
                            outletIds: e.target.checked
                              ? [...prev.outletIds, o.id]
                              : prev.outletIds.filter(id => id !== o.id),
                          }));
                        }}
                      />
                      <span className="text-gray-800">{o.name}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1">{newBeat.outletIds.length} outlet(s) selected</p>
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => { setShowCreateModal(false); setEditingBeat(null); resetForm(); }}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={editingBeat ? handleUpdateBeat : handleCreateBeat}
                disabled={!newBeat.name}
                className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingBeat ? 'Save Changes' : 'Create Draft'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Beat Modal */}
      {assigningBeat && canAssign && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Assign "{assigningBeat.name}"</h3>
              <button onClick={() => setAssigningBeat(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sales Representative *</label>
                <select
                  className="input-field"
                  value={assignForm.userId}
                  onChange={(e) => setAssignForm({ ...assignForm, userId: e.target.value })}
                >
                  <option value="">Select rep</option>
                  {salesReps.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input
                  type="date"
                  className="input-field"
                  value={assignForm.date}
                  onChange={(e) => setAssignForm({ ...assignForm, date: e.target.value })}
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button onClick={() => setAssigningBeat(null)} className="flex-1 btn-secondary">Cancel</button>
              <button
                onClick={handleAssign}
                disabled={!assignForm.userId || !assignForm.date || assigning}
                className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {assigning ? 'Assigning...' : 'Assign'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Beat Modal */}
      {viewingBeat && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">{viewingBeat.name}</h3>
              <button onClick={() => setViewingBeat(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Status</span><span className="font-medium text-gray-900">{viewingBeat.status}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Version</span><span className="font-medium text-gray-900">{viewingBeat.version}</span></div>
              {viewingBeat.description && (
                <div className="flex justify-between"><span className="text-gray-500">Description</span><span className="font-medium text-gray-900">{viewingBeat.description}</span></div>
              )}
              <div>
                <span className="text-gray-500">Outlets ({viewingBeat.outlets.length})</span>
                <ul className="list-disc list-inside mt-1 text-gray-900">
                  {viewingBeat.outlets.map(o => (
                    <li key={outletId(o)}>{outletLabel(o, outlets)}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
