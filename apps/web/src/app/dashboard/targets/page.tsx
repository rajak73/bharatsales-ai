'use client';

import { useState, useEffect } from 'react';
import { TargetsService, UsersService } from '@bharatsales/api-client';
import { SalesTarget, User } from '@bharatsales/shared-types';
import { Loader2, CheckCircle, X } from 'lucide-react';

const METRIC_OPTIONS: { label: string; value: 'SalesValue' | 'VisitCount' | 'ProductiveCalls' | 'CollectionValue' }[] = [
  { label: 'Revenue', value: 'SalesValue' },
  { label: 'Visits', value: 'VisitCount' },
  { label: 'Productive Calls', value: 'ProductiveCalls' },
  { label: 'Collections', value: 'CollectionValue' },
];

type PeriodOption = 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Annual';

function defaultDateRangeFor(period: PeriodOption): { startDate: string; endDate: string } {
  const now = new Date();
  const toISODate = (d: Date) => d.toISOString().slice(0, 10);
  if (period === 'Daily') {
    return { startDate: toISODate(now), endDate: toISODate(now) };
  }
  if (period === 'Weekly') {
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { startDate: toISODate(start), endDate: toISODate(end) };
  }
  if (period === 'Quarterly') {
    const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
    const start = new Date(now.getFullYear(), quarterStartMonth, 1);
    const end = new Date(now.getFullYear(), quarterStartMonth + 3, 0);
    return { startDate: toISODate(start), endDate: toISODate(end) };
  }
  if (period === 'Annual') {
    return { startDate: toISODate(new Date(now.getFullYear(), 0, 1)), endDate: toISODate(new Date(now.getFullYear(), 11, 31)) };
  }
  // Monthly (default)
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { startDate: toISODate(start), endDate: toISODate(end) };
}

export default function TargetsPage() {
  const [period, setPeriod] = useState('July 2026');
  const [showSetTargetModal, setShowSetTargetModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [newTarget, setNewTarget] = useState<{ metric: 'SalesValue' | 'VisitCount' | 'ProductiveCalls' | 'CollectionValue' | ''; user: string; target: string; period: PeriodOption }>({ metric: '', user: '', target: '', period: 'Monthly' });
  const [orgUsers, setOrgUsers] = useState<User[]>([]);
  const [role, setRole] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [targets, setTargets] = useState<SalesTarget[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTargets();
  }, [period]);

  useEffect(() => {
    UsersService.getUsers().then(setOrgUsers).catch(() => setOrgUsers([]));
    try {
      const token = localStorage.getItem('bharatsales_token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setRole(payload.role);
      }
    } catch {
      // ignore
    }
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
    if (!newTarget.metric || !newTarget.user || !newTarget.target) return;
    setSubmitting(true);
    setActionError('');
    try {
      const { startDate, endDate } = defaultDateRangeFor(newTarget.period);
      await TargetsService.createTarget({
        entityType: 'User',
        entityId: newTarget.user,
        period: newTarget.period,
        targetMetric: newTarget.metric,
        startDate,
        endDate,
        targetValue: Number(newTarget.target),
        actualValue: 0,
        status: 'On Track',
      });
      const metricLabel = METRIC_OPTIONS.find(m => m.value === newTarget.metric)?.label || newTarget.metric;
      setSuccessMessage(`${newTarget.period} target for ${metricLabel} set successfully!`);
      setShowSetTargetModal(false);
      setNewTarget({ metric: '', user: '', target: '', period: 'Monthly' });
      fetchTargets();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error('Failed to create target', err);
      setActionError(err?.response?.data?.message || 'Failed to create target.');
    } finally {
      setSubmitting(false);
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

      {actionError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
          <span className="text-sm text-red-700 font-medium">{actionError}</span>
          <button onClick={() => setActionError('')} className="text-red-600 hover:text-red-800"><X className="w-4 h-4" /></button>
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
                  onChange={(e) => setNewTarget({ ...newTarget, metric: e.target.value as typeof newTarget.metric })}
                >
                  <option value="">Select metric</option>
                  {METRIC_OPTIONS.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Period *</label>
                <select
                  className="input-field"
                  value={newTarget.period}
                  onChange={(e) => setNewTarget({ ...newTarget, period: e.target.value as PeriodOption })}
                >
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  {/* Annual targets are Organization Admin's call — Sales Managers work at the monthly/tactical level. */}
                  {role === 'Organization Admin' && <option value="Annual">Annual</option>}
                </select>
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button onClick={() => setShowSetTargetModal(false)} className="flex-1 btn-secondary">
                Cancel
              </button>
              <button
                onClick={handleSetTarget}
                disabled={!newTarget.metric || !newTarget.user || !newTarget.target || submitting}
                className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Setting...' : 'Set Target'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
