'use client';

import { useState, useEffect } from 'react';
import { UsersService } from '@bharatsales/api-client';
import { User, UserRole } from '@bharatsales/shared-types';
import { Loader2 } from 'lucide-react';

export default function TeamPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [showAddModal, setShowAddModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [newMember, setNewMember] = useState({ name: '', role: 'Sales Representative' as UserRole, territory: '', mobile: '', email: '' });
  const [allMembers, setAllMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await UsersService.getUsers('org-1');
      setAllMembers(data || []);
    } catch (error) {
      console.error('Failed to fetch team members:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter members
  const filteredMembers = allMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All Status' || member.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddMember = async () => {
    if (newMember.name && newMember.mobile) {
      try {
        await UsersService.createUser({
          name: newMember.name,
          role: newMember.role,
          mobile: newMember.mobile,
          email: newMember.email,
          status: 'Active',
          organizationId: 'org-1'
        });
        setSuccessMessage(`Team member "${newMember.name}" added successfully!`);
        setShowAddModal(false);
        setNewMember({ name: '', role: 'Sales Representative', territory: '', mobile: '', email: '' });
        fetchUsers(); // Refresh list
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (err) {
        console.error('Failed to create user', err);
      }
    }
  };

  const formatCurrency = (amount: number) => {
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
          <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
          <p className="text-gray-500">Manage your field sales team • {filteredMembers.length} members</p>
        </div>
        <div className="flex space-x-3">
          <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">📥 Import</button>
          <button onClick={() => setShowAddModal(true)} className="btn-primary text-sm">+ Add Member</button>
        </div>
      </div>

      {/* Team Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card text-center">
          <div className="text-2xl font-bold text-gray-900">{allMembers.length}</div>
          <div className="text-sm text-gray-500">Total Members</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-600">{allMembers.filter(m => m.status === 'Active').length}</div>
          <div className="text-sm text-gray-500">Active Today</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-primary-600">0</div>
          <div className="text-sm text-gray-500">Total Visits (Month)</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-saffron-600">₹0</div>
          <div className="text-sm text-gray-500">Team Revenue</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-wrap gap-4">
          <input
            type="text"
            placeholder="Search by name, territory..."
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
            <option>On Leave</option>
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

      {/* Team List */}
      <div className="grid gap-4">
        {loading ? (
          <div className="card flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : filteredMembers.length > 0 ? (
          filteredMembers.map((member) => (
            <div key={member.id} className="card flex items-center justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-700 font-bold">{member.name.split(' ').map(n => n[0]).join('')}</span>
                </div>
                <div>
                  <div className="font-bold text-gray-900">{member.name}</div>
                  <div className="text-sm text-gray-500">{member.role} • {member.territoryIds ? member.territoryIds.join(', ') : 'No territory'}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{member.mobile}</div>
                </div>
              </div>
              <div className="flex items-center space-x-8">
                <div className="text-center">
                  <div className="text-sm font-bold text-gray-900">0</div>
                  <div className="text-xs text-gray-500">Visits</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold text-gray-900">₹0</div>
                  <div className="text-xs text-gray-500">Orders</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold text-primary-600">0%</div>
                  <div className="text-xs text-gray-500">Target</div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${member.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {member.status}
                </span>
                <div className="flex space-x-2">
                  <button className="text-primary-600 hover:text-primary-700 text-xs font-medium">View</button>
                  <button className="text-gray-400 hover:text-gray-600 text-xs">Edit</button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="card text-center py-12">
            <div className="text-4xl mb-2">👥</div>
            <p className="text-gray-500">No team members found</p>
            <button onClick={() => { setSearchTerm(''); setStatusFilter('All Status'); }} className="mt-2 text-primary-600 text-sm font-medium">
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Add Team Member</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Enter full name"
                  value={newMember.name}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  className="input-field"
                  value={newMember.role}
                  onChange={(e) => setNewMember({ ...newMember, role: e.target.value as UserRole })}
                >
                  <option value="Sales Representative">Sales Representative</option>
                  <option value="Area Sales Manager">Area Sales Manager</option>
                  <option value="Regional Sales Manager">Regional Sales Manager</option>
                  <option value="Zonal Sales Manager">Zonal Sales Manager</option>
                  <option value="National Sales Manager">National Sales Manager</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Territory *</label>
                <select
                  className="input-field"
                  value={newMember.territory}
                  onChange={(e) => setNewMember({ ...newMember, territory: e.target.value })}
                >
                  <option value="">Select territory</option>
                  <option>Zone A</option>
                  <option>Zone B</option>
                  <option>Zone C</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                <input
                  type="tel"
                  className="input-field"
                  placeholder="+91 98765 43210"
                  value={newMember.mobile}
                  onChange={(e) => setNewMember({ ...newMember, mobile: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  className="input-field"
                  placeholder="email@company.com"
                  value={newMember.email}
                  onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button onClick={() => setShowAddModal(false)} className="flex-1 btn-secondary">
                Cancel
              </button>
              <button
                onClick={handleAddMember}
                disabled={!newMember.name || !newMember.territory || !newMember.mobile}
                className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Member
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
