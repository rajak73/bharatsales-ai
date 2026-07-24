'use client';

import { useState, useEffect } from 'react';
import { Card, Button } from '@bharatsales/ui';
import { OutletsService, DistributorsService } from '@bharatsales/api-client';
import { Outlet, Distributor } from '@bharatsales/shared-types';
import { Plus, Search, MapPin, Phone, MoreVertical, Store, Loader2 } from 'lucide-react';

export default function OutletsPage() {
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Assignment Modal State
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedOutlet, setSelectedOutlet] = useState<Outlet | null>(null);
  const [selectedDistributorId, setSelectedDistributorId] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [outletsData, distData] = await Promise.all([
        OutletsService.getOutlets(),
        DistributorsService.getDistributors()
      ]);
      setOutlets(outletsData || []);
      setDistributors(distData || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignDistributor = async () => {
    if (!selectedOutlet || !selectedDistributorId) return;
    try {
      setIsAssigning(true);
      await OutletsService.updateOutlet(selectedOutlet.id, {
        commercial: {
          ...selectedOutlet.commercial,
          assignedDistributorId: selectedDistributorId
        }
      });
      // Update local state
      setOutlets(outlets.map(o => o.id === selectedOutlet.id ? {
        ...o,
        commercial: { ...o.commercial, assignedDistributorId: selectedDistributorId }
      } : o));
      setAssignModalOpen(false);
      setSelectedOutlet(null);
      setSelectedDistributorId('');
    } catch (error) {
      console.error('Failed to assign distributor', error);
    } finally {
      setIsAssigning(false);
    }
  };

  const filteredOutlets = outlets.filter(o => 
    o.name.toLowerCase().includes(search.toLowerCase()) || 
    (o.ownerName && o.ownerName.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Outlets</h1>
          <p className="text-gray-400 text-sm mt-1">Manage your retail store network across all territories.</p>
        </div>
        <button className="px-4 py-2 bg-cyan-600/20 border border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)] rounded-lg text-sm font-medium hover:bg-cyan-600/30 transition-all flex items-center">
          <Plus className="w-4 h-4 mr-2" />
          Add Outlet
        </button>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl backdrop-blur-md shadow-sm overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search outlets by name or owner..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 w-full rounded-lg border-white/10 bg-black/20 text-white placeholder-gray-500 focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm h-10 border outline-none"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : filteredOutlets.length === 0 ? (
          <div className="text-center py-12">
            <Store className="mx-auto h-12 w-12 text-gray-600" />
            <h3 className="mt-2 text-sm font-semibold text-white">No outlets found</h3>
            <p className="mt-1 text-sm text-gray-400">Get started by creating a new outlet.</p>
            <div className="mt-6 flex justify-center">
              <button className="px-4 py-2 bg-cyan-600/20 border border-cyan-500/30 text-cyan-400 rounded-lg text-sm font-medium hover:bg-cyan-600/30 transition-all flex items-center">
                <Plus className="w-4 h-4 mr-2" />
                Add Outlet
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Store</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredOutlets.map((outlet) => (
                  <tr key={outlet.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 bg-cyan-500/10 border border-cyan-500/20 rounded-lg flex items-center justify-center">
                          <Store className="h-5 w-5 text-cyan-400" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-white">{outlet.name}</div>
                          <div className="text-sm text-gray-400">ID: {(outlet.id || (outlet as any)._id || '------').slice(-6).toUpperCase()}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300 flex items-center">
                        <MapPin className="w-4 h-4 mr-1 text-cyan-400" />
                        {outlet.location?.latitude?.toFixed(4) ?? '0.0000'}, {outlet.location?.longitude?.toFixed(4) ?? '0.0000'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300 flex items-center">
                        {outlet.mobile ? (
                          <><Phone className="w-4 h-4 mr-1 text-gray-400" />{outlet.mobile}</>
                        ) : (
                          <span className="text-gray-500 italic">No mobile</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-400 flex flex-col gap-1">
                        <span>{outlet.ownerName || 'Unknown Owner'}</span>
                        {outlet.commercial?.assignedDistributorId && (
                          <span className="text-xs bg-white/10 text-gray-300 px-2 py-0.5 rounded-full inline-block w-fit">
                            Distributor: {distributors.find(d => (d.id || (d as any)._id) === outlet.commercial?.assignedDistributorId)?.name || outlet.commercial?.assignedDistributorId}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        outlet.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {outlet.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => {
                          setSelectedOutlet(outlet);
                          setSelectedDistributorId(outlet.commercial?.assignedDistributorId || '');
                          setAssignModalOpen(true);
                        }}
                        className="text-cyan-400 hover:text-cyan-300 mr-4 text-xs font-medium"
                      >
                        Assign Distributor
                      </button>
                      <button className="text-gray-500 hover:text-white">
                        <MoreVertical className="w-5 h-5 inline-block" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assign Distributor Modal */}
      {assignModalOpen && selectedOutlet && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Assign Distributor</h3>
            <p className="text-sm text-gray-500 mb-4">Select a distributor for <span className="font-semibold text-gray-700">{selectedOutlet.name}</span></p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Distributor</label>
                <select 
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-primary-500 focus:border-primary-500"
                  value={selectedDistributorId}
                  onChange={(e) => setSelectedDistributorId(e.target.value)}
                >
                  <option value="">-- Select a Distributor --</option>
                  {distributors.filter(d => d.status === 'Active').map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button 
                onClick={() => setAssignModalOpen(false)} 
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignDistributor}
                disabled={isAssigning || !selectedDistributorId}
                className="flex-1 py-2 px-4 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 flex justify-center items-center"
              >
                {isAssigning ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Assign'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
