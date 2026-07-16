'use client';

import { useState, useEffect } from 'react';
import { DistributorsService } from '@bharatsales/api-client';
import { Distributor } from '@bharatsales/shared-types';

export default function DistributorsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [showAddModal, setShowAddModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [newDistributor, setNewDistributor] = useState({ name: '', owner: '', territory: '', gstin: '', phone: '' });
  const [allDistributors, setAllDistributors] = useState<Distributor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // In a real app, this would come from Auth context
  const organizationId = 'org-123';

  useEffect(() => {
    const fetchDistributors = async () => {
      try {
        const data = await DistributorsService.getDistributors(organizationId);
        setAllDistributors(data);
      } catch (error) {
        console.error('Failed to fetch distributors', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDistributors();
  }, []);

  // Filter distributors
  const filteredDistributors = allDistributors.filter(dist => {
    const owner = dist.ownerName || '';
    const territory = dist.location?.state || 'Unknown';
    const matchesSearch = dist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          owner.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All Status' || dist.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddDistributor = async () => {
    if (newDistributor.name && newDistributor.owner && newDistributor.territory) {
      try {
        const added = await DistributorsService.createDistributor({
          organizationId,
          name: newDistributor.name,
          ownerName: newDistributor.owner,
          code: `DIST-${Math.floor(Math.random() * 1000)}`,
          mobile: newDistributor.phone,
          status: 'Active',
          location: {
            address: '',
            city: '',
            state: newDistributor.territory,
            pinCode: '',
            latitude: 0,
            longitude: 0
          },
          tax: {
            gstin: newDistributor.gstin
          }
        });
        setAllDistributors([...allDistributors, added]);
        setSuccessMessage(`Distributor "${newDistributor.name}" added successfully!`);
        setShowAddModal(false);
        setNewDistributor({ name: '', owner: '', territory: '', gstin: '', phone: '' });
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (error) {
        console.error('Failed to add distributor', error);
      }
    }
  };

  const formatCurrency = (amount: number = 0) => {
    if (amount >= 100000) return '₹' + (amount / 100000).toFixed(1) + 'L';
    return '₹' + amount.toLocaleString();
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
          <h1 className="text-2xl font-bold text-gray-900">Distributors</h1>
          <p className="text-gray-500">Manage distributor network & inventory • {filteredDistributors.length} distributors</p>
        </div>
        <div className="flex space-x-3">
          <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">📥 Import</button>
          <button onClick={() => setShowAddModal(true)} className="btn-primary text-sm">+ Add Distributor</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card text-center">
          <div className="text-2xl font-bold text-gray-900">{allDistributors.length}</div>
          <div className="text-sm text-gray-500">Total Distributors</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-600">{allDistributors.filter(d => d.status === 'Active').length}</div>
          <div className="text-sm text-gray-500">Active</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-primary-600">89%</div>
          <div className="text-sm text-gray-500">Avg Fill Rate</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-saffron-600">32</div>
          <div className="text-sm text-gray-500">Pending Orders</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-wrap gap-4">
          <input
            type="text"
            placeholder="Search distributors..."
            className="input-field w-64"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="input-field w-40"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option>All Status</option>
            <option>Active</option>
            <option>Inactive</option>
          </select>
          {(searchTerm || statusFilter !== 'All Status') && (
            <button
              onClick={() => { setSearchTerm(''); setStatusFilter('All Status'); }}
              className="px-4 py-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Distributor Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {filteredDistributors.length > 0 ? (
          filteredDistributors.map((dist) => {
            const fillRate = 85; // mock for now
            const pendingOrders = 5; // mock for now
            const outstanding = 120000; // mock for now

            return (
              <div key={dist.id || dist.code} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="font-bold text-gray-900">{dist.name}</div>
                    <div className="text-sm text-gray-500">{dist.ownerName} • {dist.location?.state || 'Unknown'}</div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${dist.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {dist.status}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Fill Rate</div>
                    <div className="font-bold text-gray-900">{fillRate}%</div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                      <div className={`h-1.5 rounded-full ${fillRate >= 90 ? 'bg-green-500' : fillRate >= 80 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{width: `${fillRate}%`}}></div>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Pending</div>
                    <div className="font-bold text-gray-900">{pendingOrders}</div>
                    <div className="text-xs text-gray-400">orders</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Outstanding</div>
                    <div className="font-bold text-gray-900">{formatCurrency(outstanding)}</div>
                    <div className="text-xs text-gray-400">amount</div>
                  </div>
                </div>
                <div className="flex space-x-2 mt-4 pt-4 border-t border-gray-100">
                  <button className="flex-1 text-center text-sm text-primary-600 hover:text-primary-700 font-medium">View Details</button>
                  <button className="flex-1 text-center text-sm text-gray-500 hover:text-gray-700">Edit</button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-2 card text-center py-12">
            <div className="text-4xl mb-2">🏭</div>
            <p className="text-gray-500">No distributors found</p>
            <button onClick={() => { setSearchTerm(''); setStatusFilter('All Status'); }} className="mt-2 text-primary-600 text-sm font-medium">
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Add Distributor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Add New Distributor</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Distributor Name *</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Enter distributor name"
                  value={newDistributor.name}
                  onChange={(e) => setNewDistributor({ ...newDistributor, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name *</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Enter owner name"
                  value={newDistributor.owner}
                  onChange={(e) => setNewDistributor({ ...newDistributor, owner: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Territory *</label>
                <select
                  className="input-field"
                  value={newDistributor.territory}
                  onChange={(e) => setNewDistributor({ ...newDistributor, territory: e.target.value })}
                >
                  <option value="">Select territory</option>
                  <option>Zone A</option>
                  <option>Zone B</option>
                  <option>Zone C</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="29AAECR1234F1Z5"
                  value={newDistributor.gstin}
                  onChange={(e) => setNewDistributor({ ...newDistributor, gstin: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  className="input-field"
                  placeholder="+91 98765 43210"
                  value={newDistributor.phone}
                  onChange={(e) => setNewDistributor({ ...newDistributor, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button onClick={() => setShowAddModal(false)} className="flex-1 btn-secondary">
                Cancel
              </button>
              <button
                onClick={handleAddDistributor}
                disabled={!newDistributor.name || !newDistributor.owner || !newDistributor.territory}
                className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Distributor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
