'use client';

import { useState, useEffect } from 'react';
import { UsersService, PerformanceService, BeatsService, HierarchyService } from '@bharatsales/api-client';
import { User, UserRole, HierarchyNode } from '@bharatsales/shared-types';
import { Loader2, Users, X } from 'lucide-react';

export default function TeamPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', role: 'Sales Representative' as UserRole, territoryId: '', mobile: '', email: '' });
  const [allMembers, setAllMembers] = useState<User[]>([]);
  const [hierarchyNodes, setHierarchyNodes] = useState<HierarchyNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [teamDSR, setTeamDSR] = useState<any>(null);
  const [teamTargets, setTeamTargets] = useState<any[]>([]);
  const [beatCompletion, setBeatCompletion] = useState<{ teamCompletionPercentage: number; reps: any[] } | null>(null);
  const [role, setRole] = useState<string>('');
  const [inviteLink, setInviteLink] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [inviting, setInviting] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) setRole(JSON.parse(userData).role || '');
    } catch (e) {
      // ignore
    }
    fetchUsers();
    fetchTeamStats();
    fetchHierarchyNodes();
  }, []);

  const isOrgAdmin = role === 'Organization Admin';

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await UsersService.getUsers();
      setAllMembers(data || []);
    } catch (error) {
      console.error('Failed to fetch team members:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHierarchyNodes = async () => {
    try {
      const data = await HierarchyService.getHierarchyNodes();
      setHierarchyNodes(data || []);
    } catch (error) {
      console.error('Failed to fetch hierarchy nodes:', error);
    }
  };

  const fetchTeamStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const [dsr, targets, beats] = await Promise.all([
        PerformanceService.getTeamDSR(today).catch(() => null),
        PerformanceService.getTeamTargets().catch(() => []),
        BeatsService.getTeamBeatCompletion().catch(() => null),
      ]);
      setTeamDSR(dsr);
      setTeamTargets(targets || []);
      setBeatCompletion(beats);
    } catch (error) {
      console.error('Failed to fetch team stats:', error);
    }
  };

  const repStats = (userId: string) => teamDSR?.repBreakdown?.find((r: any) => r.userId === userId);
  const repTarget = (userId: string) => teamTargets.find((t: any) => t.entityId === userId);

  // Filter members
  const filteredMembers = allMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All Status' || member.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddMember = async () => {
    if (!newMember.name || !newMember.email || !newMember.territoryId) return;

    setInviteError('');
    setInviting(true);
    try {
      const result = await UsersService.inviteUser({
        name: newMember.name,
        email: newMember.email,
        role: newMember.role,
        territoryIds: [newMember.territoryId],
      });
      setInviteLink(`${window.location.origin}/invite?token=${result.inviteToken}`);
      setShowAddModal(false);
      setNewMember({ name: '', role: 'Sales Representative', territoryId: '', mobile: '', email: '' });
      fetchUsers(); // Refresh list
    } catch (err: any) {
      setInviteError(err?.response?.data?.message || err.message || 'Failed to send invitation.');
    } finally {
      setInviting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 100000) return '₹' + (amount / 100000).toFixed(1) + 'L';
    return '₹' + amount.toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isOrgAdmin ? 'Organization Team' : 'My Team'}</h1>
          <p className="text-gray-500">
            {isOrgAdmin ? 'Every employee across your organization' : 'Your direct reporting team'} • {filteredMembers.length} members
          </p>
        </div>
        <div className="flex space-x-3">
          <button onClick={() => setShowAddModal(true)} className="btn-primary text-sm">+ Add Member</button>
        </div>
      </div>

      {/* Team Stats */}
      <div className="grid grid-cols-6 gap-4">
        <div className="card text-center">
          <div className="text-2xl font-bold text-gray-900">{allMembers.length}</div>
          <div className="text-sm text-gray-500">Total Members</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-600">{allMembers.filter(m => m.status === 'Active').length}</div>
          <div className="text-sm text-gray-500">Active Today</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-primary-600">{teamDSR?.metrics?.totalVisits ?? 0}</div>
          <div className="text-sm text-gray-500">Total Visits (Today)</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-saffron-600">{formatCurrency(teamDSR?.metrics?.totalOrderValue ?? 0)}</div>
          <div className="text-sm text-gray-500">Team Revenue (Today)</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-primary-600">{beatCompletion?.teamCompletionPercentage ?? 0}%</div>
          <div className="text-sm text-gray-500">Beat Completion (Today)</div>
        </div>
        {isOrgAdmin ? (
          <div className="card text-center">
            <div className="text-2xl font-bold text-purple-600">
              {(() => {
                const totalTarget = teamTargets.reduce((sum, t) => sum + (t.targetValue || 0), 0);
                const totalActual = teamTargets.reduce((sum, t) => sum + (t.actualValue || 0), 0);
                return totalTarget > 0 ? Math.round((totalActual / totalTarget) * 100) : 0;
              })()}%
            </div>
            <div className="text-sm text-gray-500">Org-Wide Target Achievement</div>
          </div>
        ) : (
          <div className="card text-center">
            <div className="text-2xl font-bold text-red-600">
              {(beatCompletion?.reps || []).filter((r: any) => r.completionPercentage < 50).length}
            </div>
            <div className="text-sm text-gray-500">Reps Below 50% Beat Completion</div>
          </div>
        )}
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
          filteredMembers.map((member) => {
            const stats = repStats(member.id);
            const target = repTarget(member.id);
            return (
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
                  <div className="text-sm font-bold text-gray-900">{stats?.totalVisits ?? '-'}</div>
                  <div className="text-xs text-gray-500">Visits Today</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold text-gray-900">{stats ? formatCurrency(stats.totalOrderValue) : '-'}</div>
                  <div className="text-xs text-gray-500">Orders Today</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold text-primary-600">{target ? `${Math.round(target.meta?.achievementPercentage ?? 0)}%` : '-'}</div>
                  <div className="text-xs text-gray-500">Target</div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${member.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {member.status}
                </span>
              </div>
            </div>
            );
          })
        ) : (
          <div className="card text-center py-12">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
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
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
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
                  <option value="Sales Manager">Sales Manager</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Territory *</label>
                <select
                  className="input-field"
                  value={newMember.territoryId}
                  onChange={(e) => setNewMember({ ...newMember, territoryId: e.target.value })}
                >
                  <option value="">Select territory</option>
                  {hierarchyNodes.map((node) => (
                    <option key={node.id} value={node.id}>{node.level}: {node.name}</option>
                  ))}
                </select>
                {hierarchyNodes.length === 0 && (
                  <p className="text-xs text-orange-500 mt-1">No hierarchy nodes exist yet — create one from the Hierarchy page first.</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  className="input-field"
                  placeholder="+91 98765 43210"
                  value={newMember.mobile}
                  onChange={(e) => setNewMember({ ...newMember, mobile: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  className="input-field"
                  placeholder="email@company.com"
                  value={newMember.email}
                  onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                />
              </div>
              {inviteError && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{inviteError}</div>
              )}
            </div>
            <div className="flex space-x-3 mt-6">
              <button onClick={() => setShowAddModal(false)} className="flex-1 btn-secondary">
                Cancel
              </button>
              <button
                onClick={handleAddMember}
                disabled={!newMember.name || !newMember.territoryId || !newMember.email || inviting}
                className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {inviting ? 'Sending Invite...' : 'Send Invitation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Link Modal */}
      {inviteLink && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Invitation Sent</h3>
              <button onClick={() => { setInviteLink(''); setLinkCopied(false); }} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Share this link with the new team member so they can set their password and activate their account. This link expires in 72 hours.
            </p>
            <div className="flex items-center gap-2">
              <input readOnly className="input-field flex-1 text-xs" value={inviteLink} onFocus={(e) => e.target.select()} />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(inviteLink);
                  setLinkCopied(true);
                  setTimeout(() => setLinkCopied(false), 2000);
                }}
                className="btn-primary text-sm shrink-0"
              >
                {linkCopied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
