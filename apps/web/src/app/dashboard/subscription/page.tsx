'use client';

import { useState, useEffect } from 'react';
import { SubscriptionService } from '@bharatsales/api-client';
import { SubscriptionData } from '@bharatsales/shared-types';
import { Loader2 } from 'lucide-react';

export default function SubscriptionPage() {
  const [successMessage, setSuccessMessage] = useState('');
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const fetchSubscriptionData = async () => {
    try {
      setLoading(true);
      const data = await SubscriptionService.getSubscriptionData();
      setSubscriptionData(data);
    } catch (error) {
      console.error('Failed to fetch subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  const [upgradeLoading, setUpgradeLoading] = useState<string | null>(null);

  const handleUpgrade = async (planName: string) => {
    if (planName === subscriptionData?.currentPlan.name) return;
    try {
      setUpgradeLoading(planName);
      await SubscriptionService.upgradePlan(planName as any);
      setSuccessMessage(`Successfully upgraded to ${planName}!`);
      await fetchSubscriptionData();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Failed to upgrade plan:', error);
      alert('Failed to upgrade plan. Please try again.');
    } finally {
      setUpgradeLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2"><span className="text-green-600">✅</span><span className="text-sm text-green-800 font-medium">{successMessage}</span></div>
          <button onClick={() => setSuccessMessage('')} className="text-green-600 hover:text-green-800">✕</button>
        </div>
      )}

      <div><h1 className="text-2xl font-bold text-gray-900">Subscription & Billing</h1><p className="text-gray-500">Manage your plan, usage, and invoices</p></div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : subscriptionData ? (
        <>


      <div className="card gradient-primary text-white">
        <div className="flex items-center justify-between">
          <div><div className="text-white/70 text-sm">Current Plan</div><div className="text-3xl font-bold mt-1">{subscriptionData.currentPlan.name}</div><div className="text-white/80 mt-1">{subscriptionData.currentPlan.price}</div></div>
          <div className="text-right"><div className="text-white/70 text-sm">Next Billing</div><div className="text-xl font-bold mt-1">{subscriptionData.currentPlan.nextBilling}</div><span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">{subscriptionData.currentPlan.status}</span></div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="card"><h3 className="font-medium text-gray-900 mb-2">Users</h3><div className="text-2xl font-bold text-gray-900">{subscriptionData.currentPlan.users.used}/{subscriptionData.currentPlan.users.limit}</div><div className="w-full bg-gray-200 rounded-full h-2 mt-2"><div className="bg-primary-500 h-2 rounded-full" style={{width: `${(subscriptionData.currentPlan.users.used / subscriptionData.currentPlan.users.limit) * 100}%`}}></div></div><div className="text-xs text-gray-500 mt-1">{subscriptionData.currentPlan.users.limit - subscriptionData.currentPlan.users.used} remaining</div></div>
        <div className="card"><h3 className="font-medium text-gray-900 mb-2">Distributors</h3><div className="text-2xl font-bold text-gray-900">{subscriptionData.currentPlan.distributors.used}/{subscriptionData.currentPlan.distributors.limit}</div><div className="w-full bg-gray-200 rounded-full h-2 mt-2"><div className="bg-primary-500 h-2 rounded-full" style={{width: `${(subscriptionData.currentPlan.distributors.used / subscriptionData.currentPlan.distributors.limit) * 100}%`}}></div></div><div className="text-xs text-gray-500 mt-1">{subscriptionData.currentPlan.distributors.limit - subscriptionData.currentPlan.distributors.used} remaining</div></div>
        <div className="card"><h3 className="font-medium text-gray-900 mb-2">Storage</h3><div className="text-2xl font-bold text-gray-900">{subscriptionData.currentPlan.storage.used}</div><div className="text-sm text-gray-500">of {subscriptionData.currentPlan.storage.limit}</div><div className="w-full bg-gray-200 rounded-full h-2 mt-2"><div className="bg-primary-500 h-2 rounded-full" style={{width: '30%'}}></div></div></div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {subscriptionData.plans.map((plan) => (
          <div key={plan.name} className={`card relative ${plan.current ? 'ring-2 ring-primary-500' : ''}`}>
            {plan.current && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-600 text-white text-xs font-bold px-3 py-1 rounded-full">CURRENT PLAN</div>}
            <h3 className="text-lg font-bold text-gray-900 mb-1">{plan.name}</h3>
            <div className="text-2xl font-bold text-primary-600 mb-4">{plan.price}<span className="text-sm text-gray-500">/mo</span></div>
            <ul className="space-y-2 text-sm text-gray-600 mb-4"><li>• {plan.users} users</li><li>• {plan.distributors} distributors</li><li>• {plan.storage} storage</li>{plan.features.map((f) => (<li key={f}>• {f}</li>))}</ul>
            <button onClick={() => handleUpgrade(plan.name)} disabled={upgradeLoading === plan.name} className={`w-full py-2 rounded-lg text-sm font-medium ${plan.current ? 'bg-gray-100 text-gray-500' : 'btn-primary'}`}>
              {upgradeLoading === plan.name ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : (plan.current ? 'Current Plan' : 'Upgrade')}
            </button>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden p-0">
        <div className="px-6 py-4 border-b border-gray-100"><h3 className="font-bold text-gray-900">Billing History</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50"><tr className="text-left text-gray-500"><th className="px-6 py-3 font-medium">Invoice</th><th className="px-6 py-3 font-medium">Date</th><th className="px-6 py-3 font-medium">Plan</th><th className="px-6 py-3 font-medium">Amount</th><th className="px-6 py-3 font-medium">Status</th><th className="px-6 py-3 font-medium">Action</th></tr></thead>
            <tbody>{subscriptionData.invoices.map((inv) => (<tr key={inv.id} className="border-t border-gray-100"><td className="px-6 py-3 font-medium text-primary-600">{inv.id}</td><td className="px-6 py-3 text-gray-600">{inv.date}</td><td className="px-6 py-3 text-gray-600">{inv.plan}</td><td className="px-6 py-3 font-medium">{inv.amount}</td><td className="px-6 py-3"><span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">{inv.status}</span></td><td className="px-6 py-3"><button className="text-primary-600 text-xs font-medium hover:text-primary-700">Download</button></td></tr>))}</tbody>
          </table>
        </div>
      </div>
        </>
      ) : (
        <div className="text-center py-12 text-gray-500">Failed to load subscription data</div>
      )}
    </div>
  );
}
