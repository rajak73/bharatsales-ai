'use client';

import { useState, useEffect } from 'react';
import { DispatchService } from '@bharatsales/api-client';
import { Dispatch } from '@bharatsales/shared-types';
import { Loader2, Truck } from 'lucide-react';

export default function DispatchesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [successMessage, setSuccessMessage] = useState('');
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [loading, setLoading] = useState(true);

  // New Dispatch Modal State
  const [newDispatchModalOpen, setNewDispatchModalOpen] = useState(false);
  const [newDispatchForm, setNewDispatchForm] = useState({ orderId: '', vehicle: '', driver: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchDispatches();
  }, []);

  const fetchDispatches = async () => {
    try {
      setLoading(true);
      const data = await DispatchService.getDispatches('org-1');
      setDispatches(data || []);
    } catch (error) {
      console.error('Failed to fetch dispatches:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDispatches = dispatches.filter(d => {
    const matchesSearch = d.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          d.orderId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All Status' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCapturePOD = async (id: string) => {
    try {
      await DispatchService.updateDispatchStatus(id, 'Delivered');
      setDispatches(dispatches.map(d => d.id === id ? { ...d, status: 'Delivered' } : d));
      setSuccessMessage(`Proof of Delivery captured for ${id}!`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Failed to capture POD:', error);
    }
  };

  const handleCreateDispatch = async () => {
    try {
      setIsSubmitting(true);
      const created = await DispatchService.createDispatch({
        orderId: newDispatchForm.orderId,
        vehicle: newDispatchForm.vehicle,
        driver: newDispatchForm.driver,
        status: 'Pending'
      });
      setDispatches([...dispatches, created]);
      setSuccessMessage(`Dispatch created successfully!`);
      setTimeout(() => setSuccessMessage(''), 3000);
      setNewDispatchModalOpen(false);
      setNewDispatchForm({ orderId: '', vehicle: '', driver: '' });
    } catch (error) {
      console.error('Failed to create dispatch:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-green-600">✅</span>
            <span className="text-sm text-green-800 font-medium">{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage('')} className="text-green-600 hover:text-green-800">✕</button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dispatches & Deliveries</h1>
          <p className="text-gray-500">Track dispatch and delivery status • {filteredDispatches.length} dispatches</p>
        </div>
        <div className="flex space-x-3">
          <select className="input-field w-40 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option>All Status</option>
            <option>Dispatched</option>
            <option>In Transit</option>
            <option>Delivered</option>
            <option>Partial Delivery</option>
          </select>
          <button onClick={() => setNewDispatchModalOpen(true)} className="btn-primary text-sm">+ New Dispatch</button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="card text-center"><div className="text-2xl font-bold text-gray-900">{dispatches.length}</div><div className="text-sm text-gray-500">Total</div></div>
        <div className="card text-center"><div className="text-2xl font-bold text-blue-600">{dispatches.filter(d => d.status === 'In Transit').length}</div><div className="text-sm text-gray-500">In Transit</div></div>
        <div className="card text-center"><div className="text-2xl font-bold text-green-600">{dispatches.filter(d => d.status === 'Delivered').length}</div><div className="text-sm text-gray-500">Delivered</div></div>
        <div className="card text-center"><div className="text-2xl font-bold text-yellow-600">{dispatches.filter(d => d.status === 'Pending').length}</div><div className="text-sm text-gray-500">Pending</div></div>
      </div>

      <div className="card">
        <input type="text" placeholder="Search dispatches..." className="input-field w-full max-w-md" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-gray-500">
                <th className="px-6 py-3 font-medium">Dispatch ID</th>
                <th className="px-6 py-3 font-medium">Order ID</th>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Vehicle</th>
                <th className="px-6 py-3 font-medium">Driver</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredDispatches.map((d) => (
                <tr key={d.id} className="border-t border-gray-100">
                  <td className="px-6 py-3 font-medium text-primary-600">{d.id}</td>
                  <td className="px-6 py-3 text-gray-600">{d.orderId}</td>
                  <td className="px-6 py-3 text-gray-900">{new Date(d.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-3 text-gray-600">{d.vehicle}</td>
                  <td className="px-6 py-3 text-gray-600">{d.driver}</td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${d.status === 'Delivered' ? 'bg-green-100 text-green-700' : d.status === 'In Transit' ? 'bg-blue-100 text-blue-700' : d.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-purple-100 text-purple-700'}`}>{d.status}</span>
                  </td>
                  <td className="px-6 py-3">
                    {d.status !== 'Delivered' && (
                      <button onClick={() => handleCapturePOD(d.id)} className="text-primary-600 text-xs font-medium hover:text-primary-700">Capture POD</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Dispatch Modal */}
      {newDispatchModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">New Dispatch</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Order ID</label>
                <input
                  type="text"
                  className="input-field w-full"
                  placeholder="e.g. ORD-2024-001"
                  value={newDispatchForm.orderId}
                  onChange={(e) => setNewDispatchForm({ ...newDispatchForm, orderId: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Details</label>
                <input
                  type="text"
                  className="input-field w-full"
                  placeholder="e.g. MH 12 AB 1234"
                  value={newDispatchForm.vehicle}
                  onChange={(e) => setNewDispatchForm({ ...newDispatchForm, vehicle: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Driver Name / Contact</label>
                <input
                  type="text"
                  className="input-field w-full"
                  placeholder="e.g. Ramesh Kumar"
                  value={newDispatchForm.driver}
                  onChange={(e) => setNewDispatchForm({ ...newDispatchForm, driver: e.target.value })}
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button onClick={() => setNewDispatchModalOpen(false)} className="flex-1 btn-secondary text-sm">
                Cancel
              </button>
              <button
                onClick={handleCreateDispatch}
                disabled={isSubmitting || !newDispatchForm.orderId}
                className="flex-1 btn-primary text-sm disabled:opacity-50 flex justify-center items-center"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Dispatch'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
