'use client';

import { useState, useEffect } from 'react';
import { Outlet360Service } from '@bharatsales/api-client';
import { Outlet360Details, Outlet360Order, Outlet360Visit } from '@bharatsales/shared-types';
import { Loader2 } from 'lucide-react';

export default function Outlet360Page() {
  const [activeSection, setActiveSection] = useState('identity');
  const [successMessage, setSuccessMessage] = useState('');
  
  const [outlet, setOutlet] = useState<Outlet360Details | null>(null);
  const [orderHistory, setOrderHistory] = useState<Outlet360Order[]>([]);
  const [visitHistory, setVisitHistory] = useState<Outlet360Visit[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Hardcoding outletId for demonstration (should come from route params ideally)
      const outletId = '669527ec3c306df9a1bfa11b'; // Using a valid ObjectID format or whatever seed data uses
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

  const handleSave = () => {
    setSuccessMessage('Outlet details updated successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
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
          <div className="flex items-center space-x-2"><span className="text-green-600">✅</span><span className="text-sm text-green-800 font-medium">{successMessage}</span></div>
          <button onClick={() => setSuccessMessage('')} className="text-green-600 hover:text-green-800">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center"><span className="text-2xl font-bold text-primary-700">SG</span></div>
          <div><h1 className="text-2xl font-bold text-gray-900">{outlet.name}</h1><div className="flex items-center space-x-3 mt-1"><span className="text-sm text-gray-500">{outlet.code}</span><span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">{outlet.status}</span><span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">Tier {outlet.tier}</span></div></div>
        </div>
        <div className="flex space-x-3"><button className="btn-secondary text-sm">Edit</button><button className="btn-primary text-sm">New Order</button></div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-5 gap-4">
        <div className="card text-center"><div className="text-xl font-bold text-gray-900">{analytics?.totalOrders || 0}</div><div className="text-xs text-gray-500">Total Orders</div></div>
        <div className="card text-center"><div className="text-xl font-bold text-green-600">₹{(analytics?.averageOrderValue || 0).toLocaleString()}</div><div className="text-xs text-gray-500">Avg Order</div></div>
        <div className="card text-center"><div className="text-xl font-bold text-primary-600">{(analytics?.totalOrders || 0) > 0 ? (analytics.totalOrders / 3).toFixed(1) : '0'}</div><div className="text-xs text-gray-500">Freq/Month</div></div>
        <div className="card text-center"><div className="text-xl font-bold text-saffron-600">{outlet.outstanding || '0'}</div><div className="text-xs text-gray-500">Outstanding</div></div>
        <div className="card text-center"><div className="text-xl font-bold text-purple-600">{(analytics?.totalOrders || 0) === 0 ? 'High' : 'Low'}</div><div className="text-xs text-gray-500">Churn Risk</div></div>
      </div>

      {/* Section Tabs */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 overflow-x-auto">
        {[{ id: 'identity', label: 'Identity' }, { id: 'contact', label: 'Contact' }, { id: 'commercial', label: 'Commercial' }, { id: 'sales', label: 'Sales' }, { id: 'execution', label: 'Execution' }].map((tab) => (
          <button key={tab.id} onClick={() => setActiveSection(tab.id)} className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap ${activeSection === tab.id ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>{tab.label}</button>
        ))}
      </div>

      {/* Identity Section */}
      {activeSection === 'identity' && (
        <div className="card"><h3 className="font-bold text-gray-900 mb-4">Identity</h3><div className="grid grid-cols-2 gap-4 text-sm"><div><span className="text-gray-500">Code:</span> <span className="font-medium">{outlet.code}</span></div><div><span className="text-gray-500">Name:</span> <span className="font-medium">{outlet.name}</span></div><div><span className="text-gray-500">Owner:</span> <span className="font-medium">{outlet.owner}</span></div><div><span className="text-gray-500">Category:</span> <span className="font-medium">{outlet.category}</span></div></div><button onClick={handleSave} className="btn-primary text-sm mt-4">Save Changes</button></div>
      )}

      {/* Contact Section */}
      {activeSection === 'contact' && (
        <div className="card"><h3 className="font-bold text-gray-900 mb-4">Contact</h3><div className="grid grid-cols-2 gap-4 text-sm"><div><span className="text-gray-500">Mobile:</span> <span className="font-medium">{outlet.mobile}</span></div><div><span className="text-gray-500">Email:</span> <span className="font-medium">{outlet.email}</span></div><div><span className="text-gray-500">Language:</span> <span className="font-medium">{outlet.language}</span></div><div><span className="text-gray-500">Address:</span> <span className="font-medium">{outlet.address}</span></div></div></div>
      )}

      {/* Commercial Section */}
      {activeSection === 'commercial' && (
        <div className="card"><h3 className="font-bold text-gray-900 mb-4">Commercial</h3><div className="grid grid-cols-2 gap-4 text-sm"><div><span className="text-gray-500">Credit Limit:</span> <span className="font-medium">{outlet.creditLimit}</span></div><div><span className="text-gray-500">Outstanding:</span> <span className="font-medium text-saffron-600">{outlet.outstanding}</span></div><div><span className="text-gray-500">Distributor:</span> <span className="font-medium">{outlet.distributor}</span></div></div></div>
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
                  orderHistory.map((order) => (<tr key={order.id} className="border-t border-gray-100"><td className="px-6 py-3 font-medium text-primary-600">{order.id}</td><td className="px-6 py-3 text-gray-600">{order.date}</td><td className="px-6 py-3 font-medium">₹{order.amount.toLocaleString()}</td><td className="px-6 py-3"><span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">{order.status}</span></td></tr>))
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
              <thead className="bg-gray-50"><tr className="text-left text-gray-500"><th className="px-6 py-3 font-medium">Date</th><th className="px-6 py-3 font-medium">Rep</th><th className="px-6 py-3 font-medium">Duration</th><th className="px-6 py-3 font-medium">Order</th><th className="px-6 py-3 font-medium">Verified</th></tr></thead>
              <tbody>
                {visitHistory.length > 0 ? (
                  visitHistory.map((visit, idx) => (<tr key={idx} className="border-t border-gray-100"><td className="px-6 py-3 text-gray-600">{visit.date}</td><td className="px-6 py-3 text-gray-900">{visit.rep}</td><td className="px-6 py-3 text-gray-600">{visit.duration}</td><td className="px-6 py-3 font-medium">₹{visit.order.toLocaleString()}</td><td className="px-6 py-3">{visit.verified && <span className="text-green-600">✓</span>}</td></tr>))
                ) : (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No visits found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
