'use client';

import { useState, useEffect } from 'react';
import { TargetsService, UsersService } from '@bharatsales/api-client';
import { SalesTarget, User } from '@bharatsales/shared-types';
import { Loader2, CheckCircle, X } from 'lucide-react';

export default function TargetsPage() {
  const [period, setPeriod] = useState('July 2026');
  const [showSetTargetModal, setShowSetTargetModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [newTarget, setNewTarget] = useState({ metric: '', user: '', target: '', period: 'July 2026' });
  const [orgUsers, setOrgUsers] = useState<User[]>([]);

  const [targets, setTargets] = useState<SalesTarget[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTargets();
  }, [period]);

  useEffect(() => {
    UsersService.getUsers().then(setOrgUsers).catch(() => setOrgUsers([]));
  }, []);

  const fetchTargets = async () => {
    try {
      setLoading(true);
      const data = await TargetsService.getTargets();
      setTargets(data || []);
    } catch (error) {
      console.error('Failed to fetch targets:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return '₹0';
    if (amount >= 100000) return '₹' + (amount / 100000).toFixed(1) + 'L';
    return '₹' + amount.toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'On Track': return 'text-green-600 bg-green-100';
      case 'Watch': return 'text-yellow-600 bg-yellow-100';
      case 'At Risk': return 'text-red-600 bg-red-100';
      case 'Achieved': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const handleSetTarget = async () => {
    if (newTarget.metric && newTarget.user && newTarget.target) {
      try {
        await TargetsService.createTarget({
          entityType: 'User',
          entityId: newTarget.user,
          period: 'Monthly',
          targetValue: Number(newTarget.target),
          actualValue: 0,
          status: 'On Track',
          });
        setSuccessMessage(`Target for ${newTarget.metric} set successfully!`);
        setShowSetTargetModal(false);
        setNewTarget({ metric: '', user: '', target: '', period: 'July 2026' });
        fetchTargets();
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (err) {
        console.error('Failed to create target', err);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-800 font-medium">{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage('')} className="text-green-600 hover:text-green-800"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Targets & Performance</h1>
          <p className="text-gray-500">{period} — Month to date progress</p>
        </div>
        <div className="flex space-x-3">
          <select
            className="input-field w-40"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option>July 2026</option>
            <option>June 2026</option>
            <option>Q2 2026</option>
          </select>
          <button onClick={() => setShowSetTargetModal(true)} className="btn-primary text-sm">Set Targets</button>
        </div>
      </div>

      {/* Overall Progress */}
      {(() => {
        const totalActual = targets.reduce((sum, t) => sum + (t.actualValue || 0), 0);
        const totalTarget = targets.reduce((sum, t) => sum + (t.targetValue || 0), 0);
        const overallPercent = totalTarget > 0 ? Math.min(100, (totalActual / totalTarget) * 100) : 0;
        const remainingTarget = Math.max(0, totalTarget - totalActual);

        const now = Date.now();
        const upcomingEndDates = targets
          .map(t => new Date(t.endDate).getTime())
          .filter(d => !isNaN(d) && d > now);
        const nextEndDate = upcomingEndDates.length > 0 ? Math.min(...upcomingEndDates) : null;
        const daysRemaining = nextEndDate ? Math.max(0, Math.ceil((nextEndDate - now) / (1000 * 60 * 60 * 24))) : 0;
        const requiredPerDay = daysRemaining > 0 ? remainingTarget / daysRemaining : 0;

        return (
          <div className="card gradient-primary text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white/70 text-sm">Overall Achievement</div>
                <div className="text-4xl font-bold mt-1">{Math.round(overallPercent)}%</div>
                <div className="text-white/70 text-sm mt-1">{formatCurrency(totalActual)} of {formatCurrency(totalTarget)}</div>
              </div>
              <div className="text-right">
                <div className="text-white/70 text-sm">Days Remaining</div>
                <div className="text-4xl font-bold mt-1">{daysRemaining}</div>
                <div className="text-white/70 text-sm mt-1">Required: {formatCurrency(requiredPerDay)}/day</div>
              </div>
            </div>
            <div className="mt-4 w-full bg-white/20 rounded-full h-3">
              <div className="bg-white rounded-full h-3" style={{width: `${overallPercent}%`}}></div>
            </div>
          </div>
        );
      })()}

      {/* Target Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : targets.length > 0 ? (
          targets.map((t) => {
            const percent = (t.actualValue / t.targetValue) * 100;
            const remaining = Math.max(0, t.targetValue - t.actualValue);
            const entityName = t.entityType === 'User' ? (orgUsers.find(u => u.id === t.entityId)?.name || t.entityId) : t.entityId;
            return (
              <div key={t.id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900">{entityName} ({t.entityType})</h3>
                  <span className={`text-sm font-medium px-2.5 py-1 rounded-full ${getStatusColor(t.status)}`}>
                    {t.status}
                  </span>
                </div>
                <div className="mb-3">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full ${percent >= 75 ? 'bg-green-500' : percent >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{width: `${Math.min(100, percent)}%`}}
                    ></div>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Target</span>
                    <span className="font-medium">{formatCurrency(t.targetValue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Achieved</span>
                    <span className="font-medium text-green-600">{formatCurrency(t.actualValue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Remaining</span>
                    <span className="font-medium text-saffron-600">{formatCurrency(remaining)}</span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-3 card text-center py-12 text-gray-500">
            No targets found.
          </div>
        )}
      </div>

      {/* Set Target Modal */}
      {showSetTargetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Set Target</h3>
              <button onClick={() => setShowSetTargetModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Metric *</label>
                <select
                  className="input-field"
                  value={newTarget.metric}
                  onChange={(e) => setNewTarget({ ...newTarget, metric: e.target.value })}
                >
                  <option value="">Select metric</option>
                  <option>Revenue</option>
                  <option>Orders</option>
                  <option>New Outlets</option>
                  <option>Collections</option>
                  <option>Visits</option>
                  <option>Productive Calls</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">User/Team *</label>
                <select
                  className="input-field"
                  value={newTarget.user}
                  onChange={(e) => setNewTarget({ ...newTarget, user: e.target.value })}
                >
                  <option value="">Select user</option>
                  {orgUsers.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Value *</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="Enter target value"
                  value={newTarget.target}
                  onChange={(e) => setNewTarget({ ...newTarget, target: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
                <select
                  className="input-field"
                  value={newTarget.period}
                  onChange={(e) => setNewTarget({ ...newTarget, period: e.target.value })}
                >
                  <option>July 2026</option>
                  <option>August 2026</option>
                  <option>Q3 2026</option>
                </select>
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button onClick={() => setShowSetTargetModal(false)} className="flex-1 btn-secondary">
                Cancel
              </button>
              <button
                onClick={handleSetTarget}
                disabled={!newTarget.metric || !newTarget.user || !newTarget.target}
                className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Set Target
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
