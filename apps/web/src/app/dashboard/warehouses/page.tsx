'use client';

import { useState, useEffect } from 'react';
import { WarehousesService } from '@bharatsales/api-client';
import { Warehouse } from '@bharatsales/shared-types';
import { Loader2 } from 'lucide-react';

export default function WarehousesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      const data = await WarehousesService.getWarehouses();
      setWarehouses(data || []);
    } catch (error) {
      console.error('Failed to fetch warehouses:', error);
    } finally {
      setLoading(false);
    }
  };

  const stockSummary = [
    { warehouse: 'WH-01', onHand: '18,500', reserved: '3,200', available: '15,300', value: '₹8.5L' },
    { warehouse: 'WH-02', onHand: '5,200', reserved: '800', available: '4,400', value: '₹3.2L' },
    { warehouse: 'WH-03', onHand: '1,840', reserved: '350', available: '1,490', value: '₹1.8L' },
  ];

  const transfers = [
    { id: 'TRF-001', from: 'WH-01', to: 'WH-02', product: 'Surf Excel 1kg', qty: 500, status: 'In Transit', date: '14 Jul 2026' },
    { id: 'TRF-002', from: 'WH-01', to: 'WH-03', product: 'Amul Butter 500g', qty: 200, status: 'Completed', date: '13 Jul 2026' },
    { id: 'TRF-003', from: 'WH-02', to: 'WH-01', product: 'Colgate Max Fresh', qty: 300, status: 'Pending', date: '14 Jul 2026' },
  ];

  const filteredWarehouses = warehouses.filter(w => w.name.toLowerCase().includes(searchTerm.toLowerCase()) || (w.code && w.code.toLowerCase().includes(searchTerm.toLowerCase())));

  const handleNewTransfer = () => {
    setSuccessMessage('Transfer request created successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  return (
    <div className="space-y-6">
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2"><span className="text-green-600">✅</span><span className="text-sm text-green-800 font-medium">{successMessage}</span></div>
          <button onClick={() => setSuccessMessage('')} className="text-green-600 hover:text-green-800">✕</button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Warehouses</h1><p className="text-gray-500">Manage warehouse locations and stock • {warehouses.length} warehouses</p></div>
        <div className="flex space-x-3">
          <button onClick={handleNewTransfer} className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">New Transfer</button>
          <button className="btn-primary text-sm">+ Add Warehouse</button>
        </div>
      </div>

      <div className="card"><input type="text" placeholder="Search warehouses..." className="input-field w-full max-w-md" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>

      <div className="grid md:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : filteredWarehouses.length > 0 ? (
          filteredWarehouses.map((wh) => (
            <div key={wh.id} className="card">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center"><span className="text-primary-700 font-bold text-sm">{wh.code || 'WH'}</span></div>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${wh.status === 'Active' ? 'bg-green-100 text-green-700' : wh.status === 'Inactive' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{wh.status}</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-1">{wh.name}</h3>
              <p className="text-xs text-gray-500 mb-3">{wh.location}</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Capacity</span><span className="font-medium">{wh.capacity}</span></div>
                {wh.utilization !== undefined && (
                  <>
                    <div className="flex justify-between"><span className="text-gray-500">Utilization</span><span className="font-medium">{wh.utilization}%</span></div>
                    <div className="w-full bg-gray-200 rounded-full h-2"><div className={`h-2 rounded-full ${wh.utilization > 80 ? 'bg-red-500' : wh.utilization > 60 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{width: `${wh.utilization}%`}}></div></div>
                  </>
                )}
                <div className="flex justify-between"><span className="text-gray-500">Manager</span><span className="font-medium">{wh.manager || 'Unassigned'}</span></div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-3 text-center py-12 text-gray-500 card">
            No warehouses found.
          </div>
        )}
      </div>

      <div className="card overflow-hidden p-0">
        <div className="px-6 py-4 border-b border-gray-100"><h3 className="font-bold text-gray-900">Stock Summary by Warehouse</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50"><tr className="text-left text-gray-500"><th className="px-6 py-3 font-medium">Warehouse</th><th className="px-6 py-3 font-medium">On Hand</th><th className="px-6 py-3 font-medium">Reserved</th><th className="px-6 py-3 font-medium">Available</th><th className="px-6 py-3 font-medium">Value</th></tr></thead>
            <tbody>{stockSummary.map((stock) => (<tr key={stock.warehouse} className="border-t border-gray-100"><td className="px-6 py-3 font-medium text-gray-900">{stock.warehouse}</td><td className="px-6 py-3">{stock.onHand}</td><td className="px-6 py-3 text-purple-600">{stock.reserved}</td><td className="px-6 py-3 font-medium text-green-600">{stock.available}</td><td className="px-6 py-3 font-medium">{stock.value}</td></tr>))}</tbody>
          </table>
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="px-6 py-4 border-b border-gray-100"><h3 className="font-bold text-gray-900">Warehouse Transfers</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50"><tr className="text-left text-gray-500"><th className="px-6 py-3 font-medium">ID</th><th className="px-6 py-3 font-medium">From</th><th className="px-6 py-3 font-medium">To</th><th className="px-6 py-3 font-medium">Product</th><th className="px-6 py-3 font-medium">Qty</th><th className="px-6 py-3 font-medium">Status</th><th className="px-6 py-3 font-medium">Date</th></tr></thead>
            <tbody>{transfers.map((transfer) => (<tr key={transfer.id} className="border-t border-gray-100"><td className="px-6 py-3 font-medium text-primary-600">{transfer.id}</td><td className="px-6 py-3">{transfer.from}</td><td className="px-6 py-3">{transfer.to}</td><td className="px-6 py-3 text-gray-900">{transfer.product}</td><td className="px-6 py-3">{transfer.qty}</td><td className="px-6 py-3"><span className={`px-2 py-1 rounded text-xs font-medium ${transfer.status === 'Completed' ? 'bg-green-100 text-green-700' : transfer.status === 'In Transit' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>{transfer.status}</span></td><td className="px-6 py-3 text-gray-500">{transfer.date}</td></tr>))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
