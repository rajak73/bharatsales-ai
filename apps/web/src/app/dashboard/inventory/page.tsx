'use client';

import { useState, useEffect } from 'react';
import { InventoryService } from '@bharatsales/api-client';
import { Inventory } from '@bharatsales/shared-types';

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('All Warehouses');
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [newAdjustment, setNewAdjustment] = useState({ product: '', batch: '', type: '', quantity: '', reason: '' });
  const [allInventory, setAllInventory] = useState<Inventory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const data = await InventoryService.getInventory();
        setAllInventory(data);
      } catch (error) {
        console.error('Failed to fetch inventory', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInventory();
  }, []);

  // Filter inventory
  const filteredInventory = allInventory.filter(item => {
    const matchesSearch = item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.batch.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesWarehouse = warehouseFilter === 'All Warehouses' || item.warehouseId === warehouseFilter;
    return matchesSearch && matchesWarehouse;
  });

  const handleAdjustment = async () => {
    if (newAdjustment.product && newAdjustment.batch && newAdjustment.type && newAdjustment.quantity) {
      try {
        await InventoryService.adjustStock({
          productId: newAdjustment.product,
          batch: newAdjustment.batch,
          type: newAdjustment.type,
          quantity: parseInt(newAdjustment.quantity, 10),
          reason: newAdjustment.reason
        });
        
        // Refresh inventory from server
        const data = await InventoryService.getInventory();
        setAllInventory(data);
        
        setSuccessMessage(`Stock adjustment of ${newAdjustment.quantity} units for ${newAdjustment.product} recorded!`);
        setShowAdjustmentModal(false);
        setNewAdjustment({ product: '', batch: '', type: '', quantity: '', reason: '' });
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (error) {
        console.error('Failed to adjust inventory', error);
        alert('Failed to adjust stock. Please check quantities.');
      }
    }
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
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-500">Stock overview, batches & movements • {filteredInventory.length} items</p>
        </div>
        <div className="flex space-x-3">
          <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">📦 Stock Movement</button>
          <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">🔄 Transfer</button>
          <button onClick={() => setShowAdjustmentModal(true)} className="btn-primary text-sm">+ Adjustment</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        <div className="card text-center">
          <div className="text-2xl font-bold text-gray-900">{allInventory.reduce((sum, i) => sum + (i.stock || 0), 0).toLocaleString()}</div>
          <div className="text-sm text-gray-500">Total On Hand</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-purple-600">3,690</div>
          <div className="text-sm text-gray-500">Reserved</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-600">{allInventory.reduce((sum, i) => sum + (i.stock || 0), 0).toLocaleString()}</div>
          <div className="text-sm text-gray-500">Available</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-red-600">50</div>
          <div className="text-sm text-gray-500">Blocked</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-yellow-600">{allInventory.filter(i => i.expiry?.includes('Sep') || i.expiry?.includes('Nov')).length}</div>
          <div className="text-sm text-gray-500">Expiring Soon</div>
        </div>
      </div>

      {/* Alerts */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center space-x-2 mb-2">
            <span>⚠️</span>
            <span className="font-medium text-red-800">Expiry Alert</span>
          </div>
          <p className="text-sm text-red-700">2 batches expiring within 30 days</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center space-x-2 mb-2">
            <span>📦</span>
            <span className="font-medium text-yellow-800">Low Stock</span>
          </div>
          <p className="text-sm text-yellow-700">2 products below minimum level</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center space-x-2 mb-2">
            <span>🔄</span>
            <span className="font-medium text-blue-800">Pending Transfers</span>
          </div>
          <p className="text-sm text-blue-700">1 transfer awaiting approval</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-wrap gap-4">
          <input
            type="text"
            placeholder="Search by product, SKU, batch..."
            className="input-field w-64"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="input-field w-40"
            value={warehouseFilter}
            onChange={(e) => setWarehouseFilter(e.target.value)}
          >
            <option>All Warehouses</option>
            <option>WH-01</option>
            <option>WH-02</option>
          </select>
          {(searchTerm || warehouseFilter !== 'All Warehouses') && (
            <button
              onClick={() => { setSearchTerm(''); setWarehouseFilter('All Warehouses'); }}
              className="px-4 py-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Inventory Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-gray-500">
                <th className="px-6 py-3 font-medium">Product</th>
                <th className="px-6 py-3 font-medium">Batch</th>
                <th className="px-6 py-3 font-medium">Expiry</th>
                <th className="px-6 py-3 font-medium">On Hand</th>
                <th className="px-6 py-3 font-medium">Reserved</th>
                <th className="px-6 py-3 font-medium">Available</th>
                <th className="px-6 py-3 font-medium">Blocked</th>
                <th className="px-6 py-3 font-medium">Warehouse</th>
                <th className="px-6 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.length > 0 ? (
                filteredInventory.map((item) => (
                  <tr key={item.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-3">
                      <div className="font-medium text-gray-900">{item.productName}</div>
                      <div className="text-xs text-gray-400">{item.sku}</div>
                    </td>
                    <td className="px-6 py-3 text-gray-600">{item.batch}</td>
                    <td className="px-6 py-3">
                      <span className={`text-sm ${item.expiry?.includes('Sep') || item.expiry?.includes('Nov') ? 'text-yellow-600 font-medium' : 'text-gray-600'}`}>
                        {item.expiry || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-3 font-medium text-gray-900">{((item.stock || 0) + (item.reservedStock || 0)).toLocaleString()}</td>
                    <td className="px-6 py-3 text-purple-600">{(item.reservedStock || 0).toLocaleString()}</td>
                    <td className="px-6 py-3 font-medium text-green-600">{(item.stock || 0).toLocaleString()}</td>
                    <td className="px-6 py-3">
                      <span className="text-gray-400">0</span>
                    </td>
                    <td className="px-6 py-3 text-gray-600">{item.warehouseId || '-'}</td>
                    <td className="px-6 py-3">
                      <div className="flex space-x-2">
                        <button className="text-primary-600 hover:text-primary-700 font-medium text-xs">View</button>
                        <button className="text-gray-400 hover:text-gray-600 text-xs">Adjust</button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-400">
                    <div className="text-4xl mb-2">📦</div>
                    <p className="text-sm">No inventory items found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjustment Modal */}
      {showAdjustmentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Stock Adjustment</h3>
              <button onClick={() => setShowAdjustmentModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product *</label>
                <select
                  className="input-field"
                  value={newAdjustment.product}
                  onChange={(e) => setNewAdjustment({ ...newAdjustment, product: e.target.value })}
                >
                  <option value="">Select product</option>
                  {allInventory.map(item => (
                    <option key={item.id} value={item.productId}>{item.productName} ({item.sku})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Batch *</label>
                <select
                  className="input-field"
                  value={newAdjustment.batch}
                  onChange={(e) => setNewAdjustment({ ...newAdjustment, batch: e.target.value })}
                >
                  <option value="">Select batch</option>
                  {allInventory.map(item => (
                    <option key={`batch-${item.id}`} value={item.batch}>{item.batch}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                <select
                  className="input-field"
                  value={newAdjustment.type}
                  onChange={(e) => setNewAdjustment({ ...newAdjustment, type: e.target.value })}
                >
                  <option value="">Select type</option>
                  <option>Damage</option>
                  <option>Expiry</option>
                  <option>Correction</option>
                  <option>Transfer In</option>
                  <option>Transfer Out</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="Enter quantity"
                  value={newAdjustment.quantity}
                  onChange={(e) => setNewAdjustment({ ...newAdjustment, quantity: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <textarea
                  className="input-field"
                  rows={2}
                  placeholder="Enter reason for adjustment"
                  value={newAdjustment.reason}
                  onChange={(e) => setNewAdjustment({ ...newAdjustment, reason: e.target.value })}
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button onClick={() => setShowAdjustmentModal(false)} className="flex-1 btn-secondary">
                Cancel
              </button>
              <button
                onClick={handleAdjustment}
                disabled={!newAdjustment.product || !newAdjustment.batch || !newAdjustment.type || !newAdjustment.quantity}
                className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Adjustment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
