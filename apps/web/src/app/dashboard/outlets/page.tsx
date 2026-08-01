'use client';

import { useState, useEffect } from 'react';
import { Card, Button } from '@bharatsales/ui';
import { OutletsService, DistributorsService } from '@bharatsales/api-client';
import { Outlet, Distributor } from '@bharatsales/shared-types';
import { Plus, Search, MapPin, Phone, MoreVertical, Store, Loader2, X, CheckCircle, Power, Trash2 } from 'lucide-react';

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

  const [showAddModal, setShowAddModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [confirmDeleteOutlet, setConfirmDeleteOutlet] = useState<Outlet | null>(null);
  const [newOutlet, setNewOutlet] = useState({
    name: '', code: '', ownerName: '', category: 'Grocery', tier: 'B' as 'A' | 'B' | 'C' | 'D',
    mobile: '', address: '', state: '', pinCode: '', creditLimit: '10000', paymentTermsDays: '7',
  });

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

  const handleCreateOutlet = async () => {
    if (!newOutlet.name || !newOutlet.code || !newOutlet.ownerName || !newOutlet.mobile) return;
    setCreating(true);
    setFormError('');
    try {
      await OutletsService.createOutlet({
        name: newOutlet.name,
        code: newOutlet.code,
        ownerName: newOutlet.ownerName,
        category: newOutlet.category,
        tier: newOutlet.tier,
        status: 'Active',
        mobile: newOutlet.mobile,
        location: {
          address: newOutlet.address,
          state: newOutlet.state,
          pinCode: newOutlet.pinCode,
          latitude: 0,
          longitude: 0,
          geofenceRadiusMeters: 100,
        },
        commercial: {
          creditLimit: Number(newOutlet.creditLimit) || 0,
          paymentTermsDays: Number(newOutlet.paymentTermsDays) || 0,
          outstandingBalance: 0,
        },
        tax: {},
      } as any);
      setShowAddModal(false);
      setNewOutlet({ name: '', code: '', ownerName: '', category: 'Grocery', tier: 'B', mobile: '', address: '', state: '', pinCode: '', creditLimit: '10000', paymentTermsDays: '7' });
      setSuccessMessage(`Outlet "${newOutlet.name}" added successfully!`);
      setTimeout(() => setSuccessMessage(''), 4000);
      await fetchData();
    } catch (error: any) {
      setFormError(error?.response?.data?.message || 'Failed to add outlet.');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleStatus = async (outlet: Outlet) => {
    setOpenMenuId(null);
    const newStatus = outlet.status === 'Active' ? 'Inactive' : 'Active';
    try {
      await OutletsService.updateOutlet(outlet.id, { status: newStatus });
      setOutlets(outlets.map(o => o.id === outlet.id ? { ...o, status: newStatus } : o));
    } catch (error) {
      console.error('Failed to update outlet status', error);
    }
  };

  const handleDeleteOutlet = async (outlet: Outlet) => {
    try {
      await OutletsService.deleteOutlet(outlet.id);
      setOutlets(outlets.filter(o => o.id !== outlet.id));
      setConfirmDeleteOutlet(null);
    } catch (error) {
      console.error('Failed to delete outlet', error);
    }
  };

  const filteredOutlets = outlets.filter(o =>
    o.name.toLowerCase().includes(search.toLowerCase()) || 
    (o.ownerName && o.ownerName.toLowerCase().includes(search.toLowerCase()))
  );

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

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Outlets</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your retail store network across all territories.</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Outlet
        </Button>
      </div>

      <Card>
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search outlets by name or owner..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 w-full rounded-lg border-gray-200 focus:border-primary-500 focus:ring-primary-500 sm:text-sm h-10 border"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : filteredOutlets.length === 0 ? (
          <div className="text-center py-12">
            <Store className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">No outlets found</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new outlet.</p>
            <div className="mt-6">
              <Button onClick={() => setShowAddModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Outlet
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Store</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOutlets.map((outlet) => (
                  <tr key={outlet.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 bg-primary-100 rounded-lg flex items-center justify-center">
                          <Store className="h-5 w-5 text-primary-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{outlet.name}</div>
                          <div className="text-sm text-gray-500">ID: {(outlet.id || (outlet as any)._id || '------').slice(-6).toUpperCase()}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center">
                        <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                        {outlet.location?.latitude?.toFixed(4) ?? '0.0000'}, {outlet.location?.longitude?.toFixed(4) ?? '0.0000'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center">
                        {outlet.mobile ? (
                          <><Phone className="w-4 h-4 mr-1 text-gray-400" />{outlet.mobile}</>
                        ) : (
                          <span className="text-gray-400 italic">No mobile</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 flex flex-col gap-1">
                        <span>{outlet.ownerName || 'Unknown Owner'}</span>
                        {outlet.commercial?.assignedDistributorId && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full inline-block w-fit">
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
                        className="text-primary-600 hover:text-primary-900 mr-4 text-xs font-medium"
                      >
                        Assign Distributor
                      </button>
                      <div className="relative inline-block">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === outlet.id ? null : outlet.id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <MoreVertical className="w-5 h-5 inline-block" />
                        </button>
                        {openMenuId === outlet.id && (
                          <div className="absolute right-0 mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-10 text-left">
                            <button
                              onClick={() => handleToggleStatus(outlet)}
                              className="w-full flex items-center gap-2 px-4 py-2 text-xs text-gray-700 hover:bg-gray-50"
                            >
                              <Power className="w-3.5 h-3.5" />
                              {outlet.status === 'Active' ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              onClick={() => { setOpenMenuId(null); setConfirmDeleteOutlet(outlet); }}
                              className="w-full flex items-center gap-2 px-4 py-2 text-xs text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

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

      {/* Add Outlet Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Add Outlet</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">{formError}</div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Outlet Name *</label>
                  <input type="text" className="input-field" value={newOutlet.name} onChange={(e) => setNewOutlet({ ...newOutlet, name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Outlet Code *</label>
                  <input type="text" className="input-field" value={newOutlet.code} onChange={(e) => setNewOutlet({ ...newOutlet, code: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name *</label>
                  <input type="text" className="input-field" value={newOutlet.ownerName} onChange={(e) => setNewOutlet({ ...newOutlet, ownerName: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mobile *</label>
                  <input type="tel" className="input-field" value={newOutlet.mobile} onChange={(e) => setNewOutlet({ ...newOutlet, mobile: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <input type="text" className="input-field" value={newOutlet.category} onChange={(e) => setNewOutlet({ ...newOutlet, category: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tier</label>
                  <select className="input-field" value={newOutlet.tier} onChange={(e) => setNewOutlet({ ...newOutlet, tier: e.target.value as any })}>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input type="text" className="input-field" value={newOutlet.address} onChange={(e) => setNewOutlet({ ...newOutlet, address: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input type="text" className="input-field" value={newOutlet.state} onChange={(e) => setNewOutlet({ ...newOutlet, state: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pin Code</label>
                  <input type="text" className="input-field" value={newOutlet.pinCode} onChange={(e) => setNewOutlet({ ...newOutlet, pinCode: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Credit Limit (₹)</label>
                  <input type="number" className="input-field" value={newOutlet.creditLimit} onChange={(e) => setNewOutlet({ ...newOutlet, creditLimit: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms (days)</label>
                  <input type="number" className="input-field" value={newOutlet.paymentTermsDays} onChange={(e) => setNewOutlet({ ...newOutlet, paymentTermsDays: e.target.value })} />
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button onClick={() => setShowAddModal(false)} className="flex-1 btn-secondary">Cancel</button>
              <button
                onClick={handleCreateOutlet}
                disabled={creating || !newOutlet.name || !newOutlet.code || !newOutlet.ownerName || !newOutlet.mobile}
                className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? 'Adding...' : 'Add Outlet'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteOutlet && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete outlet?</h3>
            <p className="text-sm text-gray-500 mb-6">This will permanently delete "{confirmDeleteOutlet.name}". This cannot be undone.</p>
            <div className="flex space-x-3">
              <button onClick={() => setConfirmDeleteOutlet(null)} className="flex-1 btn-secondary">Cancel</button>
              <button
                onClick={() => handleDeleteOutlet(confirmDeleteOutlet)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl py-2.5 text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
