'use client';

import { useState, useEffect } from 'react';
import { Outlet360Service, OutletsService } from '@bharatsales/api-client';
import { Outlet360Details, Outlet360Order, Outlet360Visit } from '@bharatsales/shared-types';
import { Loader2, CheckCircle, X, Check } from 'lucide-react';

function getInitials(name: string): string {
  return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase() || '?';
}

export default function Outlet360Page() {
  const [activeSection, setActiveSection] = useState('identity');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [outlet, setOutlet] = useState<Outlet360Details | null>(null);
  const [orderHistory, setOrderHistory] = useState<Outlet360Order[]>([]);
  const [visitHistory, setVisitHistory] = useState<Outlet360Visit[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', ownerName: '', category: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const urlParams = new URLSearchParams(window.location.search);
      let outletId = urlParams.get('id');

      if (!outletId) {
        // Fallback: fetch all outlets and pick the first one
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://bharatsales-ai.onrender.com'}/outlets`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('bharatsales_token') || ''}`
          }
        });
        if (response.ok) {
          const allOutlets = await response.json();
          if (allOutlets && allOutlets.length > 0) {
            outletId = allOutlets[0].id || allOutlets[0]._id;
          }
        }
      }

      if (!outletId) {
        setLoading(false);
        return; // outlet will remain null -> "Outlet not found"
      }

      const data = await Outlet360Service.getOutlet360(outletId);

      setOutlet(data.outlet);
      setOrderHistory(data.recentOrders || []);
      setVisitHistory(data.recentVisits || []);
      setAnalytics(data.analytics);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const startEditing = () => {
    if (!outlet) return;
    setEditForm({ name: outlet.name, ownerName: outlet.owner, category: outlet.category });
    setIsEditing(true);
    setActiveSection('identity');
  };

  const handleSave = async () => {
    if (!outlet) return;
    setSaving(true);
    setErrorMessage('');
    try {
      await OutletsService.updateOutlet(outlet.id, {
        name: editForm.name,
        ownerName: editForm.ownerName,
        category: editForm.category,
      });
      setOutlet({ ...outlet, name: editForm.name, owner: editForm.ownerName, category: editForm.category });
      setIsEditing(false);
      setSuccessMessage('Outlet details updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Failed to update outlet', error);
      setErrorMessage('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!outlet) {
    return <div className="text-center py-12 text-gray-500">Outlet not found</div>;
  }

  return (
    <div className="space-y-6">
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2"><CheckCircle className="w-4 h-4 text-green-600" /><span className="text-sm text-green-800 font-medium">{successMessage}</span></div>
          <button onClick={() => setSuccessMessage('')} className="text-green-600 hover:text-green-800"><X className="w-4 h-4" /></button>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
          <span className="text-sm text-red-700 font-medium">{errorMessage}</span>
          <button onClick={() => setErrorMessage('')} className="text-red-600 hover:text-red-800"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center"><span className="text-2xl font-bold text-primary-700">{getInitials(outlet.name)}</span></div>
          <div><h1 className="text-2xl font-bold text-gray-900">{outlet.name}</h1><div className="flex items-center space-x-3 mt-1"><span className="text-sm text-gray-500">{outlet.code}</span><span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">{outlet.status}</span><span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">Tier {outlet.tier}</span></div></div>
        </div>
        <div className="flex space-x-3"><button onClick={startEditing} className="btn-secondary text-sm">Edit</button></div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card text-center"><div className="text-xl font-bold text-gray-900">{analytics?.totalOrders || 0}</div><div className="text-xs text-gray-500">Total Orders</div></div>
        <div className="card text-center"><div className="text-xl font-bold text-green-600">₹{(analytics?.averageOrderValue || 0).toLocaleString()}</div><div className="text-xs text-gray-500">Avg Order</div></div>
        <div className="card text-center"><div className="text-xl font-bold text-primary-600">₹{(analytics?.totalRevenue || 0).toLocaleString()}</div><div className="text-xs text-gray-500">Total Revenue</div></div>
        <div className="card text-center"><div className="text-xl font-bold text-saffron-600">₹{outlet.outstanding.toLocaleString()}</div><div className="text-xs text-gray-500">Outstanding</div></div>
      </div>

      {/* Section Tabs */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 overflow-x-auto">
        {[{ id: 'identity', label: 'Identity' }, { id: 'contact', label: 'Contact' }, { id: 'commercial', label: 'Commercial' }, { id: 'sales', label: 'Sales' }, { id: 'execution', label: 'Execution' }].map((tab) => (
          <button key={tab.id} onClick={() => { setActiveSection(tab.id); setIsEditing(false); }} className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap ${activeSection === tab.id ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>{tab.label}</button>
        ))}
      </div>

      {/* Identity Section */}
      {activeSection === 'identity' && (
        <div className="card">
          <h3 className="font-bold text-gray-900 mb-4">Identity</h3>
          {isEditing ? (
            <div className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input type="text" className="input-field" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Owner</label>
                <input type="text" className="input-field" value={editForm.ownerName} onChange={(e) => setEditForm({ ...editForm, ownerName: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <input type="text" className="input-field" value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setIsEditing(false)} className="btn-secondary text-sm">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="btn-primary text-sm disabled:opacity-50 flex items-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 text-sm"><div><span className="text-gray-500">Code:</span> <span className="font-medium">{outlet.code}</span></div><div><span className="text-gray-500">Name:</span> <span className="font-medium">{outlet.name}</span></div><div><span className="text-gray-500">Owner:</span> <span className="font-medium">{outlet.owner}</span></div><div><span className="text-gray-500">Category:</span> <span className="font-medium">{outlet.category}</span></div></div>
              <button onClick={startEditing} className="btn-primary text-sm mt-4">Edit Details</button>
            </>
          )}
        </div>
      )}

      {/* Contact Section */}
      {activeSection === 'contact' && (
        <div className="card"><h3 className="font-bold text-gray-900 mb-4">Contact</h3><div className="grid grid-cols-2 gap-4 text-sm"><div><span className="text-gray-500">Mobile:</span> <span className="font-medium">{outlet.mobile}</span></div><div><span className="text-gray-500">Address:</span> <span className="font-medium">{outlet.address}</span></div><div><span className="text-gray-500">State:</span> <span className="font-medium">{outlet.state}</span></div><div><span className="text-gray-500">Pin Code:</span> <span className="font-medium">{outlet.pin}</span></div></div></div>
      )}

      {/* Commercial Section */}
      {activeSection === 'commercial' && (
        <div className="card"><h3 className="font-bold text-gray-900 mb-4">Commercial</h3><div className="grid grid-cols-2 gap-4 text-sm"><div><span className="text-gray-500">Credit Limit:</span> <span className="font-medium">₹{outlet.creditLimit.toLocaleString()}</span></div><div><span className="text-gray-500">Outstanding:</span> <span className="font-medium text-saffron-600">₹{outlet.outstanding.toLocaleString()}</span></div><div><span className="text-gray-500">GSTIN:</span> <span className="font-medium">{outlet.gstin}</span></div><div><span className="text-gray-500">Distributor:</span> <span className="font-medium">{outlet.distributorId || 'Unassigned'}</span></div></div></div>
      )}

      {/* Sales Section */}
      {activeSection === 'sales' && (
        <div className="card overflow-hidden p-0">
          <div className="px-6 py-4 border-b border-gray-100"><h3 className="font-bold text-gray-900">Order History</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50"><tr className="text-left text-gray-500"><th className="px-6 py-3 font-medium">Order</th><th className="px-6 py-3 font-medium">Date</th><th className="px-6 py-3 font-medium">Amount</th><th className="px-6 py-3 font-medium">Status</th></tr></thead>
              <tbody>
                {orderHistory.length > 0 ? (
                  orderHistory.map((order) => (<tr key={order.id} className="border-t border-gray-100"><td className="px-6 py-3 font-medium text-primary-600">{order.orderNumber}</td><td className="px-6 py-3 text-gray-600">{order.date}</td><td className="px-6 py-3 font-medium">₹{order.amount.toLocaleString()}</td><td className="px-6 py-3"><span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">{order.status}</span></td></tr>))
                ) : (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No orders found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Execution Section */}
      {activeSection === 'execution' && (
        <div className="card overflow-hidden p-0">
          <div className="px-6 py-4 border-b border-gray-100"><h3 className="font-bold text-gray-900">Visit History</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50"><tr className="text-left text-gray-500"><th className="px-6 py-3 font-medium">Date</th><th className="px-6 py-3 font-medium">Rep</th><th className="px-6 py-3 font-medium">Duration</th><th className="px-6 py-3 font-medium">Verified</th></tr></thead>
              <tbody>
                {visitHistory.length > 0 ? (
                  visitHistory.map((visit, idx) => (<tr key={idx} className="border-t border-gray-100"><td className="px-6 py-3 text-gray-600">{visit.date}</td><td className="px-6 py-3 text-gray-900">{visit.rep}</td><td className="px-6 py-3 text-gray-600">{visit.duration}</td><td className="px-6 py-3">{visit.verified && <Check className="w-4 h-4 text-green-600" />}</td></tr>))
                ) : (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No visits found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
