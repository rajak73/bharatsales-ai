'use client';

import { useState, useEffect } from 'react';
import { DistributorsService } from '@bharatsales/api-client';
import { Distributor } from '@bharatsales/shared-types';
import { Search, Filter, Plus, Download, Users, UserCheck, Activity, Clock } from 'lucide-react';

export default function DistributorsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [regionFilter, setRegionFilter] = useState('All Regions');
  const [showAddModal, setShowAddModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [allDistributors, setAllDistributors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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
    fetchDistributors();
  }, []);

  const filteredDistributors = allDistributors.filter(dist => {
    const territory = dist.location?.state || 'Unknown';
    const matchesSearch = dist.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All Status' || dist.status === statusFilter;
    const matchesRegion = regionFilter === 'All Regions' || territory.includes(regionFilter);
    return matchesSearch && matchesStatus && matchesRegion;
  });

  return (
    <div className="space-y-8 bg-slate-50 min-h-screen font-sans -m-6 sm:-m-8 lg:-m-8 p-6 sm:p-8 lg:p-8 rounded-tl-3xl">
      
      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center">✅</div>
            <span className="text-sm text-green-800 font-bold">{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage('')} className="text-green-600 hover:text-green-800">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1E293B] tracking-tight">Distributor Network</h1>
          <p className="text-[#64748B] mt-1 text-sm font-medium">Here's an overview of your distributor performance.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-[#475569] hover:bg-gray-50 hover:text-[#1E293B] transition-colors shadow-sm">
            <Download size={16} />
            Download Report
          </button>
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-[#2D3A8C] hover:bg-[#1e2761] text-white rounded-xl text-sm font-bold transition-colors shadow-md shadow-blue-900/10">
            <Plus size={18} />
            Add Distributor
          </button>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center gap-5">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
            {/* @ts-ignore */}
            <Users size={28} />
          </div>
          <div>
            <p className="text-sm font-bold text-[#64748B] uppercase tracking-wider mb-1">Total Distributors</p>
            <h3 className="text-3xl font-bold text-[#1E293B]">{allDistributors.length}</h3>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center gap-5">
          <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center shrink-0">
            {/* @ts-ignore */}
            <UserCheck size={28} />
          </div>
          <div>
            <p className="text-sm font-bold text-[#64748B] uppercase tracking-wider mb-1">Active</p>
            <h3 className="text-3xl font-bold text-[#1E293B]">{allDistributors.filter(d => d.status === 'Active').length}</h3>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center gap-5">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
            {/* @ts-ignore */}
            <Activity size={28} />
          </div>
          <div>
            <p className="text-sm font-bold text-[#64748B] uppercase tracking-wider mb-1">Avg Fill Rate</p>
            <h3 className="text-3xl font-bold text-[#1E293B]">{Math.round(allDistributors.reduce((acc, curr) => acc + curr.inventoryHealth, 0) / (allDistributors.length || 1))}%</h3>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center gap-5">
          <div className="w-14 h-14 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center shrink-0">
            {/* @ts-ignore */}
            <Clock size={28} />
          </div>
          <div>
            <p className="text-sm font-bold text-[#64748B] uppercase tracking-wider mb-1">Pending Orders</p>
            <h3 className="text-3xl font-bold text-[#1E293B]">{allDistributors.reduce((acc, curr) => acc + curr.pendingOrders, 0)}</h3>
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
            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2D3A8C]/20 focus:border-[#2D3A8C] outline-none transition-all text-sm font-medium text-[#1E293B] shadow-sm"
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
              className="pl-9 pr-8 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2D3A8C]/20 focus:border-[#2D3A8C] outline-none transition-all text-sm font-bold text-[#475569] shadow-sm appearance-none cursor-pointer min-w-[160px]"
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
              className="pl-9 pr-8 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2D3A8C]/20 focus:border-[#2D3A8C] outline-none transition-all text-sm font-bold text-[#475569] shadow-sm appearance-none cursor-pointer min-w-[160px]"
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
           <div className="col-span-full flex justify-center py-12"><div className="w-8 h-8 border-4 border-[#2D3A8C] border-t-transparent rounded-full animate-spin"></div></div>
        ) : filteredDistributors.length > 0 ? (
          filteredDistributors.map((dist) => (
            <div key={dist.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative group">
              
              <div className="absolute top-6 right-6">
                <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${dist.status === 'Active' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                  {dist.status}
                </span>
              </div>

              <div className="mb-6 pr-20">
                <h3 className="font-bold text-lg text-[#1E293B] truncate">{dist.name}</h3>
                <p className="text-sm font-medium text-[#64748B] flex items-center gap-1 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span> {dist.location?.state}
                </p>
              </div>

              <div className="space-y-5 mb-6">
                <div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-bold text-[#475569]">Inventory Health</span>
                    <span className="font-bold text-[#1E293B]">{dist.inventoryHealth}%</span>
                  </div>
                  <div className="w-full bg-[#F1F5F9] rounded-full h-2">
                    <div className={`h-2 rounded-full ${dist.inventoryHealth >= 90 ? 'bg-green-500' : dist.inventoryHealth >= 70 ? 'bg-blue-500' : 'bg-red-500'}`} style={{width: `${dist.inventoryHealth}%`}}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-bold text-[#475569]">Order Fulfillment</span>
                    <span className="font-bold text-[#1E293B]">{dist.orderFulfillment}%</span>
                  </div>
                  <div className="w-full bg-[#F1F5F9] rounded-full h-2">
                    <div className="h-2 rounded-full bg-blue-500" style={{width: `${dist.orderFulfillment}%`}}></div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                  <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
                    <Clock size={16} />
                  </div>
                  <p className="text-sm font-bold text-[#475569]">
                    <span className="text-[#1E293B]">{dist.pendingOrders}</span> Pending Orders
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button className="flex-1 py-2.5 text-sm font-bold text-[#2D3A8C] bg-[#F1F5F9] rounded-xl hover:bg-[#E2E8F0] transition-colors text-center">
                  View Inventory
                </button>
                <button className="flex-1 py-2.5 text-sm font-bold text-[#475569] bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-center">
                  Process Orders
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <div className="text-[#64748B] mb-2"><Search size={48} className="mx-auto opacity-20" /></div>
            <p className="text-lg font-bold text-[#1E293B]">No distributors found</p>
            <p className="text-[#64748B] text-sm mt-1">Try adjusting your filters or search term.</p>
            <button onClick={() => { setSearchTerm(''); setStatusFilter('All Status'); setRegionFilter('All Regions'); }} className="mt-4 px-6 py-2 bg-[#2D3A8C] text-white font-bold rounded-xl text-sm">
              Clear Filters
            </button>
          </div>
        )}
      </div>

    </div>
  );
}

