'use client';

import { useState, useEffect } from 'react';
import { IncentivesService } from '@bharatsales/api-client';
import { IncentivePlan, IncentivePayout } from '@bharatsales/shared-types';
import { Loader2, CheckCircle, X } from 'lucide-react';

const INCENTIVE_TYPES = ['Volume', 'Value', 'New Outlet Acquisition', 'Collection'];

export default function IncentivesPage() {
  const [successMessage, setSuccessMessage] = useState('');

  const [incentivePlans, setIncentivePlans] = useState<IncentivePlan[]>([]);
  const [payouts, setPayouts] = useState<IncentivePayout[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');
  const [newPlan, setNewPlan] = useState({
    name: '', type: 'Volume', slab: '', target: '', eligible: 'All Reps', payout: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [plans, items] = await Promise.all([
        IncentivesService.getIncentivePlans(),
        IncentivesService.getIncentivePayouts()
      ]);
      setIncentivePlans(plans || []);
      setPayouts(items || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async () => {
    if (!newPlan.name || !newPlan.target || !newPlan.payout) return;
    setCreating(true);
    setFormError('');
    try {
      await IncentivesService.createIncentivePlan({
        name: newPlan.name,
        type: newPlan.type,
        slab: newPlan.slab || 'N/A',
        target: newPlan.target,
        eligible: newPlan.eligible,
        payout: newPlan.payout,
        status: 'Active'
      });
      setShowCreateModal(false);
      setNewPlan({ name: '', type: 'Volume', slab: '', target: '', eligible: 'All Reps', payout: '' });
      setSuccessMessage('New incentive plan created successfully!');
      fetchData(); // Refresh the list
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Failed to create plan', error);
      setFormError('Failed to create incentive plan.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2"><CheckCircle className="w-4 h-4 text-green-600" /><span className="text-sm text-green-800 font-medium">{successMessage}</span></div>
          <button onClick={() => setSuccessMessage('')} className="text-green-600 hover:text-green-800"><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Incentives</h1><p className="text-gray-500">Manage incentive plans and payouts • {incentivePlans.length} active plans</p></div>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary text-sm">+ Create Incentive Plan</button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="card text-center"><div className="text-2xl font-bold text-gray-900">{incentivePlans.length}</div><div className="text-sm text-gray-500">Active Plans</div></div>
        <div className="card text-center"><div className="text-2xl font-bold text-green-600">₹{payouts.reduce((s, p) => s + p.incentive, 0).toLocaleString()}</div><div className="text-sm text-gray-500">Total Payout (Jul)</div></div>
        <div className="card text-center"><div className="text-2xl font-bold text-primary-600">{payouts.filter(p => p.incentive > 0).length}</div><div className="text-sm text-gray-500">Eligible Reps</div></div>
        <div className="card text-center"><div className="text-2xl font-bold text-yellow-600">{payouts.filter(p => p.status === 'Pending').length}</div><div className="text-sm text-gray-500">Pending Approval</div></div>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="px-6 py-4 border-b border-gray-100"><h3 className="font-bold text-gray-900">Incentive Plans</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50"><tr className="text-left text-gray-500"><th className="px-6 py-3 font-medium">Plan Name</th><th className="px-6 py-3 font-medium">Type</th><th className="px-6 py-3 font-medium">Slab</th><th className="px-6 py-3 font-medium">Target</th><th className="px-6 py-3 font-medium">Eligible</th><th className="px-6 py-3 font-medium">Payout</th><th className="px-6 py-3 font-medium">Status</th></tr></thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></td>
                </tr>
              ) : incentivePlans.length > 0 ? (
                incentivePlans.map((plan) => (<tr key={plan.id} className="border-t border-gray-100"><td className="px-6 py-3 font-medium text-gray-900">{plan.name}</td><td className="px-6 py-3"><span className="px-2 py-1 bg-primary-50 text-primary-700 rounded text-xs font-medium">{plan.type}</span></td><td className="px-6 py-3 text-gray-600 text-xs">{plan.slab}</td><td className="px-6 py-3 text-gray-600">{plan.target}</td><td className="px-6 py-3 text-gray-600">{plan.eligible}</td><td className="px-6 py-3 text-gray-600">{plan.payout}</td><td className="px-6 py-3"><span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">{plan.status}</span></td></tr>))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">No incentive plans found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="px-6 py-4 border-b border-gray-100"><h3 className="font-bold text-gray-900">Payouts - July 2026</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50"><tr className="text-left text-gray-500"><th className="px-6 py-3 font-medium">Rep</th><th className="px-6 py-3 font-medium">Target</th><th className="px-6 py-3 font-medium">Achieved</th><th className="px-6 py-3 font-medium">Achievement %</th><th className="px-6 py-3 font-medium">Incentive</th><th className="px-6 py-3 font-medium">Status</th></tr></thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></td>
                </tr>
              ) : payouts.length > 0 ? (
                payouts.map((payout) => { const achievement = Math.round((payout.achieved / payout.target) * 100); return (<tr key={payout.id} className="border-t border-gray-100"><td className="px-6 py-3 font-medium text-gray-900">{payout.rep}</td><td className="px-6 py-3 text-gray-600">₹{payout.target.toLocaleString()}</td><td className="px-6 py-3 font-medium text-green-600">₹{payout.achieved.toLocaleString()}</td><td className="px-6 py-3"><div className="flex items-center space-x-2"><div className="w-16 bg-gray-200 rounded-full h-2"><div className={`h-2 rounded-full ${achievement >= 100 ? 'bg-green-500' : 'bg-yellow-500'}`} style={{width: `${Math.min(achievement, 100)}%`}}></div></div><span className="text-xs font-medium">{achievement}%</span></div></td><td className="px-6 py-3 font-medium text-saffron-600">₹{payout.incentive.toLocaleString()}</td><td className="px-6 py-3"><span className={`px-2.5 py-1 rounded-full text-xs font-medium ${payout.status === 'Approved' ? 'bg-green-100 text-green-700' : payout.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>{payout.status}</span></td></tr>); })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">No payouts found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Incentive Plan Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Create Incentive Plan</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>

            {formError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">{formError}</div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name *</label>
                <input type="text" className="input-field" placeholder="e.g. Q3 Volume Booster" value={newPlan.name} onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select className="input-field" value={newPlan.type} onChange={(e) => setNewPlan({ ...newPlan, type: e.target.value })}>
                    {INCENTIVE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Slab / Tier</label>
                  <input type="text" className="input-field" placeholder="e.g. Tier A" value={newPlan.slab} onChange={(e) => setNewPlan({ ...newPlan, slab: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target *</label>
                  <input type="text" className="input-field" placeholder="e.g. 100 Orders" value={newPlan.target} onChange={(e) => setNewPlan({ ...newPlan, target: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payout *</label>
                  <input type="text" className="input-field" placeholder="e.g. ₹5,000" value={newPlan.payout} onChange={(e) => setNewPlan({ ...newPlan, payout: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Eligible</label>
                <input type="text" className="input-field" placeholder="e.g. All Reps" value={newPlan.eligible} onChange={(e) => setNewPlan({ ...newPlan, eligible: e.target.value })} />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button onClick={() => setShowCreateModal(false)} className="flex-1 btn-secondary">Cancel</button>
              <button
                onClick={handleCreatePlan}
                disabled={creating || !newPlan.name || !newPlan.target || !newPlan.payout}
                className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? 'Creating...' : 'Create Plan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
