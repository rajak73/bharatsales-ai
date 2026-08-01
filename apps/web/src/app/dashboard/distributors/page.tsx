'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DistributorsService } from '@bharatsales/api-client';
import { Search, Filter, Plus, Users, UserCheck, Activity, Clock, CheckCircle, X, Loader2 } from 'lucide-react';

export default function DistributorsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [regionFilter, setRegionFilter] = useState('All Regions');
  const [showAddModal, setShowAddModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [allDistributors, setAllDistributors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [newDistributor, setNewDistributor] = useState({
    name: '', code: '', ownerName: '', mobile: '',
    address: '', city: '', state: '', pinCode: '',
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const fetchDistributors = async () => {
    try {
      setIsLoading(true);
      const data = await DistributorsService.getDistributors().catch(() => []);

      if (data && data.length > 0) {
        // If we have real data, map it to match our UI requirements
        const mappedData = data.map((d: any) => ({
          id: d.id || d._id || d.code,
          name: d.name,
          location: { state: d.location?.state || d.territory || 'Unknown' },
          status: d.status || 'Active',
          inventoryHealth: d.fillRate || 0,
          orderFulfillment: d.orderFulfillment || 0,
          pendingOrders: d.pendingOrders || 0
        }));
        setAllDistributors(mappedData);
      } else {
        setAllDistributors([]);
      }
    } catch (error) {
      console.error('Failed to fetch distributors', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDistributors();
  }, []);

  const filteredDistributors = allDistributors.filter(dist => {
    const territory = dist.location?.state || 'Unknown';
    const matchesSearch = dist.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All Status' || dist.status === statusFilter;
    const matchesRegion = regionFilter === 'All Regions' || territory.includes(regionFilter);
    return matchesSearch && matchesStatus && matchesRegion;
  });

  const handleCreateDistributor = async () => {
    if (!newDistributor.name || !newDistributor.code || !newDistributor.ownerName || !newDistributor.mobile) return;
    setCreating(true);
    setCreateError('');
    try {
      await DistributorsService.createDistributor({
        name: newDistributor.name,
        code: newDistributor.code,
        ownerName: newDistributor.ownerName,
        mobile: newDistributor.mobile,
        status: 'Active',
        location: {
          address: newDistributor.address,
          city: newDistributor.city,
          state: newDistributor.state,
          pinCode: newDistributor.pinCode,
          latitude: 0,
          longitude: 0,
        },
      } as any);
      setShowAddModal(false);
      setNewDistributor({ name: '', code: '', ownerName: '', mobile: '', address: '', city: '', state: '', pinCode: '' });
      setSuccessMessage(`Distributor "${newDistributor.name}" added successfully!`);
      setTimeout(() => setSuccessMessage(''), 4000);
      await fetchDistributors();
    } catch (error: any) {
      setCreateError(error?.response?.data?.message || 'Failed to add distributor.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-8 bg-slate-50 min-h-screen font-sans -m-6 sm:-m-8 lg:-m-8 p-6 sm:p-8 lg:p-8 rounded-tl-3xl">

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
              <CheckCircle size={16} />
            </div>
            <span className="text-sm text-green-800 font-bold">{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage('')} className="text-green-600 hover:text-green-800">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Distributor Network</h1>
          <p className="text-slate-500 mt-1 text-sm font-medium">Here's an overview of your distributor performance.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-bold transition-colors shadow-md shadow-primary-900/10">
            <Plus size={18} />
            Add Distributor
          </button>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center gap-5">
          <div className="w-14 h-14 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center shrink-0">
            <Users size={28} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Total Distributors</p>
            <h3 className="text-3xl font-bold text-slate-800">{allDistributors.length}</h3>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center gap-5">
          <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center shrink-0">
            <UserCheck size={28} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Active</p>
            <h3 className="text-3xl font-bold text-slate-800">{allDistributors.filter(d => d.status === 'Active').length}</h3>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center gap-5">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
            <Activity size={28} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Avg Fill Rate</p>
            <h3 className="text-3xl font-bold text-slate-800">{allDistributors.length > 0 ? Math.round(allDistributors.reduce((acc, curr) => acc + curr.inventoryHealth, 0) / allDistributors.length) : 0}%</h3>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center gap-5">
          <div className="w-14 h-14 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center shrink-0">
            <Clock size={28} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Pending Orders</p>
            <h3 className="text-3xl font-bold text-slate-800">{allDistributors.reduce((acc, curr) => acc + curr.pendingOrders, 0)}</h3>
          </div>
        </div>

      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search distributors by name..."
            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-sm font-medium text-slate-800 shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="w-4 h-4 text-gray-400" />
            </div>
            <select
              className="pl-9 pr-8 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-sm font-bold text-slate-600 shadow-sm appearance-none cursor-pointer min-w-[160px]"
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
            >
              <option>All Regions</option>
              <option>Delhi North</option>
              <option>Gurgaon</option>
              <option>Noida</option>
              <option>South Delhi</option>
            </select>
          </div>

          <div className="relative">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="w-4 h-4 text-gray-400" />
            </div>
            <select
              className="pl-9 pr-8 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-sm font-bold text-slate-600 shadow-sm appearance-none cursor-pointer min-w-[160px]"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option>All Status</option>
              <option>Active</option>
              <option>Review</option>
              <option>Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Distributor Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {isLoading ? (
           <div className="col-span-full flex justify-center py-12"><Loader2 className="w-8 h-8 text-primary-600 animate-spin" /></div>
        ) : filteredDistributors.length > 0 ? (
          filteredDistributors.map((dist) => (
            <div key={dist.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative group">

              <div className="absolute top-6 right-6">
                <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${dist.status === 'Active' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                  {dist.status}
                </span>
              </div>

              <div className="mb-6 pr-20">
                <h3 className="font-bold text-lg text-slate-800 truncate">{dist.name}</h3>
                <p className="text-sm font-medium text-slate-500 flex items-center gap-1 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span> {dist.location?.state}
                </p>
              </div>

              <div className="space-y-5 mb-6">
                <div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-bold text-slate-600">Inventory Health</span>
                    <span className="font-bold text-slate-800">{dist.inventoryHealth}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className={`h-2 rounded-full ${dist.inventoryHealth >= 90 ? 'bg-green-500' : dist.inventoryHealth >= 70 ? 'bg-primary-500' : 'bg-red-500'}`} style={{width: `${dist.inventoryHealth}%`}}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-bold text-slate-600">Order Fulfillment</span>
                    <span className="font-bold text-slate-800">{dist.orderFulfillment}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="h-2 rounded-full bg-primary-500" style={{width: `${dist.orderFulfillment}%`}}></div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                  <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
                    <Clock size={16} />
                  </div>
                  <p className="text-sm font-bold text-slate-600">
                    <span className="text-slate-800">{dist.pendingOrders}</span> Pending Orders
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => router.push('/dashboard/inventory')} className="flex-1 py-2.5 text-sm font-bold text-primary-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors text-center">
                  View Inventory
                </button>
                <button onClick={() => router.push('/dashboard/orders')} className="flex-1 py-2.5 text-sm font-bold text-slate-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-center">
                  Process Orders
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <div className="text-slate-500 mb-2"><Search size={48} className="mx-auto opacity-20" /></div>
            <p className="text-lg font-bold text-slate-800">No distributors found</p>
            <p className="text-slate-500 text-sm mt-1">Try adjusting your filters or search term.</p>
            <button onClick={() => { setSearchTerm(''); setStatusFilter('All Status'); setRegionFilter('All Regions'); }} className="mt-4 px-6 py-2 bg-primary-600 text-white font-bold rounded-xl text-sm">
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Add Distributor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-800">Add Distributor</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            {createError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">{createError}</div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Distributor Name *</label>
                  <input type="text" className="input-field" value={newDistributor.name} onChange={(e) => setNewDistributor({ ...newDistributor, name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Distributor Code *</label>
                  <input type="text" className="input-field" value={newDistributor.code} onChange={(e) => setNewDistributor({ ...newDistributor, code: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name *</label>
                  <input type="text" className="input-field" value={newDistributor.ownerName} onChange={(e) => setNewDistributor({ ...newDistributor, ownerName: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mobile *</label>
                  <input type="tel" className="input-field" value={newDistributor.mobile} onChange={(e) => setNewDistributor({ ...newDistributor, mobile: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input type="text" className="input-field" value={newDistributor.address} onChange={(e) => setNewDistributor({ ...newDistributor, address: e.target.value })} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input type="text" className="input-field" value={newDistributor.city} onChange={(e) => setNewDistributor({ ...newDistributor, city: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input type="text" className="input-field" value={newDistributor.state} onChange={(e) => setNewDistributor({ ...newDistributor, state: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pin Code</label>
                  <input type="text" className="input-field" value={newDistributor.pinCode} onChange={(e) => setNewDistributor({ ...newDistributor, pinCode: e.target.value })} />
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button onClick={() => setShowAddModal(false)} className="flex-1 btn-secondary">Cancel</button>
              <button
                onClick={handleCreateDistributor}
                disabled={creating || !newDistributor.name || !newDistributor.code || !newDistributor.ownerName || !newDistributor.mobile}
                className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? 'Adding...' : 'Add Distributor'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
