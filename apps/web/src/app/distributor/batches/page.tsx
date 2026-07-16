'use client';

import { useState } from 'react';

export default function DistributorBatchesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('All Warehouses');
  const [successMessage, setSuccessMessage] = useState('');
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [newAdjustment, setNewAdjustment] = useState({ product: '', batch: '', type: '', quantity: '', reason: '' });

  const allBatches = [
    { batch: 'B20260315', product: 'Surf Excel 1kg', expiry: 'Mar 2027', onHand: 2450, reserved: 320, available: 2130, status: 'Good', shelfLife: 85 },
    { batch: 'B20260401', product: 'Colgate Max Fresh', expiry: 'Apr 2027', onHand: 5200, reserved: 800, available: 4400, status: 'Good', shelfLife: 90 },
    { batch: 'B20260510', product: 'Parle-G 200g', expiry: 'Nov 2026', onHand: 12000, reserved: 2000, available: 10000, status: 'Good', shelfLife: 45 },
    { batch: 'B20260201', product: 'Dettol Soap 70g', expiry: 'Feb 2027', onHand: 3800, reserved: 450, available: 3350, status: 'Warning', shelfLife: 25 },
    { batch: 'B20260701', product: 'Amul Butter 500g', expiry: 'Sep 2026', onHand: 890, reserved: 120, available: 770, status: 'Good', shelfLife: 60 },
    { batch: 'B20260615', product: 'Tata Tea Gold 1kg', expiry: 'Dec 2026', onHand: 1200, reserved: 200, available: 1000, status: 'Good', shelfLife: 55 },
  ];

  const movements = [
    { date: '14 Jul 2026', type: 'Receipt', product: 'Surf Excel 1kg', batch: 'B20260315', qty: 500, ref: 'PO-123', actor: 'Rajesh' },
    { date: '14 Jul 2026', type: 'Dispatch', product: 'Colgate Max Fresh', batch: 'B20260401', qty: -200, ref: 'ORD-2400', actor: 'System' },
    { date: '14 Jul 2026', type: 'Reservation', product: 'Parle-G 200g', batch: 'B20260510', qty: -100, ref: 'ORD-2399', actor: 'System' },
    { date: '13 Jul 2026', type: 'Transfer', product: 'Dettol Soap 70g', batch: 'B20260201', qty: 50, ref: 'WH-01 → WH-02', actor: 'Amit' },
  ];

  const filteredBatches = allBatches.filter(b => {
    const matchesSearch = b.product.toLowerCase().includes(searchTerm.toLowerCase()) || b.batch.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleAdjustment = () => {
    if (newAdjustment.product && newAdjustment.batch && newAdjustment.type && newAdjustment.quantity) {
      setSuccessMessage(`Stock adjustment of ${newAdjustment.quantity} units recorded!`);
      setShowAdjustmentModal(false);
      setNewAdjustment({ product: '', batch: '', type: '', quantity: '', reason: '' });
      setTimeout(() => setSuccessMessage(''), 3000);
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

      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Batches & Stock Ledger</h1><p className="text-gray-500">FEFO batch management • {filteredBatches.length} batches</p></div>
        <div className="flex space-x-3">
          <button className="btn-secondary text-sm">📦 Stock Movement</button>
          <button onClick={() => setShowAdjustmentModal(true)} className="btn-primary text-sm">+ Adjustment</button>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4"><div className="flex items-center space-x-2"><span>ℹ️</span><span className="text-sm text-blue-800"><strong>FEFO Allocation:</strong> First-Expired-First-Out selects earliest valid expiry date that satisfies minimum shelf-life policy.</span></div></div>

      <div className="grid grid-cols-5 gap-4">
        <div className="card text-center"><div className="text-2xl font-bold text-gray-900">{allBatches.reduce((s, b) => s + b.onHand, 0).toLocaleString()}</div><div className="text-sm text-gray-500">On Hand</div></div>
        <div className="card text-center"><div className="text-2xl font-bold text-purple-600">{allBatches.reduce((s, b) => s + b.reserved, 0).toLocaleString()}</div><div className="text-sm text-gray-500">Reserved</div></div>
        <div className="card text-center"><div className="text-2xl font-bold text-green-600">{allBatches.reduce((s, b) => s + b.available, 0).toLocaleString()}</div><div className="text-sm text-gray-500">Available</div></div>
        <div className="card text-center"><div className="text-2xl font-bold text-red-600">{allBatches.filter(b => b.status === 'Warning').length}</div><div className="text-sm text-gray-500">Expiring Soon</div></div>
        <div className="card text-center"><div className="text-2xl font-bold text-yellow-600">94%</div><div className="text-sm text-gray-500">Avg Fill Rate</div></div>
      </div>

      <div className="card"><input type="text" placeholder="Search batches..." className="input-field w-full max-w-md" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50"><tr className="text-left text-gray-500"><th className="px-6 py-3 font-medium">Batch</th><th className="px-6 py-3 font-medium">Product</th><th className="px-6 py-3 font-medium">Expiry</th><th className="px-6 py-3 font-medium">On Hand</th><th className="px-6 py-3 font-medium">Reserved</th><th className="px-6 py-3 font-medium">Available</th><th className="px-6 py-3 font-medium">Shelf Life</th><th className="px-6 py-3 font-medium">Status</th></tr></thead>
            <tbody>{filteredBatches.map((batch) => (<tr key={batch.batch} className="border-t border-gray-100"><td className="px-6 py-3 font-medium text-primary-600">{batch.batch}</td><td className="px-6 py-3 text-gray-900">{batch.product}</td><td className="px-6 py-3"><span className={`text-sm ${batch.shelfLife < 30 ? 'text-yellow-600 font-medium' : 'text-gray-600'}`}>{batch.expiry}</span></td><td className="px-6 py-3 font-medium">{batch.onHand.toLocaleString()}</td><td className="px-6 py-3 text-purple-600">{batch.reserved.toLocaleString()}</td><td className="px-6 py-3 font-medium text-green-600">{batch.available.toLocaleString()}</td><td className="px-6 py-3"><div className="flex items-center space-x-2"><div className="w-12 bg-gray-200 rounded-full h-1.5"><div className={`h-1.5 rounded-full ${batch.shelfLife > 50 ? 'bg-green-500' : batch.shelfLife > 25 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{width: `${batch.shelfLife}%`}}></div></div><span className="text-xs">{batch.shelfLife}%</span></div></td><td className="px-6 py-3"><span className={`px-2 py-1 rounded text-xs font-medium ${batch.status === 'Good' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{batch.status}</span></td></tr>))}</tbody>
          </table>
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="px-6 py-4 border-b border-gray-100"><h3 className="font-bold text-gray-900">Stock Movements (Immutable Ledger)</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50"><tr className="text-left text-gray-500"><th className="px-6 py-3 font-medium">Date</th><th className="px-6 py-3 font-medium">Type</th><th className="px-6 py-3 font-medium">Product</th><th className="px-6 py-3 font-medium">Batch</th><th className="px-6 py-3 font-medium">Quantity</th><th className="px-6 py-3 font-medium">Reference</th><th className="px-6 py-3 font-medium">Actor</th></tr></thead>
            <tbody>{movements.map((move, idx) => (<tr key={idx} className="border-t border-gray-100"><td className="px-6 py-3 text-gray-500">{move.date}</td><td className="px-6 py-3"><span className={`px-2 py-1 rounded text-xs font-medium ${move.type === 'Receipt' ? 'bg-green-100 text-green-700' : move.type === 'Dispatch' ? 'bg-blue-100 text-blue-700' : move.type === 'Reservation' ? 'bg-purple-100 text-purple-700' : 'bg-yellow-100 text-yellow-700'}`}>{move.type}</span></td><td className="px-6 py-3 text-gray-900">{move.product}</td><td className="px-6 py-3 text-gray-600">{move.batch}</td><td className={`px-6 py-3 font-medium ${move.qty > 0 ? 'text-green-600' : 'text-red-600'}`}>{move.qty > 0 ? '+' : ''}{move.qty}</td><td className="px-6 py-3 text-gray-600">{move.ref}</td><td className="px-6 py-3 text-gray-600">{move.actor}</td></tr>))}</tbody>
          </table>
        </div>
      </div>

      {showAdjustmentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6"><h3 className="text-lg font-bold text-gray-900">Stock Adjustment</h3><button onClick={() => setShowAdjustmentModal(false)} className="text-gray-400 hover:text-gray-600">✕</button></div>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Product *</label><select className="input-field" value={newAdjustment.product} onChange={(e) => setNewAdjustment({ ...newAdjustment, product: e.target.value })}><option value="">Select</option>{allBatches.map(b => (<option key={b.batch} value={b.batch}>{b.product}</option>))}</select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Batch *</label><select className="input-field" value={newAdjustment.batch} onChange={(e) => setNewAdjustment({ ...newAdjustment, batch: e.target.value })}><option value="">Select</option>{allBatches.map(b => (<option key={b.batch} value={b.batch}>{b.batch}</option>))}</select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Type *</label><select className="input-field" value={newAdjustment.type} onChange={(e) => setNewAdjustment({ ...newAdjustment, type: e.target.value })}><option value="">Select</option><option>Damage</option><option>Expiry</option><option>Correction</option></select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label><input type="number" className="input-field" placeholder="Enter quantity" value={newAdjustment.quantity} onChange={(e) => setNewAdjustment({ ...newAdjustment, quantity: e.target.value })} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Reason</label><textarea className="input-field" rows={2} placeholder="Enter reason" value={newAdjustment.reason} onChange={(e) => setNewAdjustment({ ...newAdjustment, reason: e.target.value })} /></div>
            </div>
            <div className="flex space-x-3 mt-6"><button onClick={() => setShowAdjustmentModal(false)} className="flex-1 btn-secondary">Cancel</button><button onClick={handleAdjustment} disabled={!newAdjustment.product || !newAdjustment.batch || !newAdjustment.type || !newAdjustment.quantity} className="flex-1 btn-primary disabled:opacity-50">Submit</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
