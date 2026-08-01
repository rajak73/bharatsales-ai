'use client';

import { useState, useEffect } from 'react';
import { InventoryService } from '@bharatsales/api-client';
import { Inventory } from '@bharatsales/shared-types';
import { CheckCircle, X, AlertTriangle, PackageX, Package } from 'lucide-react';

const LOW_STOCK_THRESHOLD = 20;

function isExpiringSoon(expiry?: string): boolean {
  if (!expiry) return false;
  const date = new Date(expiry);
  if (isNaN(date.getTime())) return false;
  const daysUntilExpiry = (date.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return daysUntilExpiry >= 0 && daysUntilExpiry <= 30;
}

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('All Warehouses');
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [newAdjustment, setNewAdjustment] = useState({ product: '', batch: '', type: '', quantity: '', reason: '' });
  const [allInventory, setAllInventory] = useState<Inventory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [adjustmentError, setAdjustmentError] = useState('');

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
      setAdjustmentError('');
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
      } catch (error: any) {
        console.error('Failed to adjust inventory', error);
        setAdjustmentError(error?.response?.data?.message || 'Failed to adjust stock. Please check quantities.');
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
          <button onClick={() => setSuccessMessage('')} className="text-green-600 hover:text-green-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-500">Stock overview, batches & movements • {filteredInventory.length} items</p>
        </div>
        <div className="flex space-x-3">
          <button onClick={() => setShowAdjustmentModal(true)} className="btn-primary text-sm">+ Adjustment</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card text-center">
          <div className="text-2xl font-bold text-gray-900">{allInventory.reduce((sum, i) => sum + (i.stock || 0) + (i.reservedStock || 0), 0).toLocaleString()}</div>
          <div className="text-sm text-gray-500">Total On Hand</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-purple-600">{allInventory.reduce((sum, i) => sum + (i.reservedStock || 0), 0).toLocaleString()}</div>
          <div className="text-sm text-gray-500">Reserved</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-600">{allInventory.reduce((sum, i) => sum + (i.stock || 0), 0).toLocaleString()}</div>
          <div className="text-sm text-gray-500">Available</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-yellow-600">{allInventory.filter(i => isExpiringSoon(i.expiry)).length}</div>
          <div className="text-sm text-gray-500">Expiring Soon</div>
        </div>
      </div>

      {/* Alerts */}
      {(allInventory.some(i => isExpiringSoon(i.expiry)) || allInventory.some(i => (i.stock || 0) <= LOW_STOCK_THRESHOLD)) && (
        <div className="grid md:grid-cols-2 gap-4">
          {allInventory.filter(i => isExpiringSoon(i.expiry)).length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="font-medium text-red-800">Expiry Alert</span>
              </div>
              <p className="text-sm text-red-700">{allInventory.filter(i => isExpiringSoon(i.expiry)).length} batch(es) expiring within 30 days</p>
            </div>
          )}
          {allInventory.filter(i => (i.stock || 0) <= LOW_STOCK_THRESHOLD).length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <PackageX className="w-4 h-4 text-yellow-600" />
                <span className="font-medium text-yellow-800">Low Stock</span>
              </div>
              <p className="text-sm text-yellow-700">{allInventory.filter(i => (i.stock || 0) <= LOW_STOCK_THRESHOLD).length} batch(es) at or below {LOW_STOCK_THRESHOLD} units</p>
            </div>
          )}
        </div>
      )}

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
                      <span className={`text-sm ${isExpiringSoon(item.expiry) ? 'text-yellow-600 font-medium' : 'text-gray-600'}`}>
                        {item.expiry || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-3 font-medium text-gray-900">{((item.stock || 0) + (item.reservedStock || 0)).toLocaleString()}</td>
                    <td className="px-6 py-3 text-purple-600">{(item.reservedStock || 0).toLocaleString()}</td>
                    <td className="px-6 py-3 font-medium text-green-600">{(item.stock || 0).toLocaleString()}</td>
                    <td className="px-6 py-3">
                      <span className={item.blocked ? 'text-red-600 font-medium' : 'text-gray-400'}>{item.blocked ? (item.stock || 0).toLocaleString() : 0}</span>
                    </td>
                    <td className="px-6 py-3 text-gray-600">{item.warehouseId || '-'}</td>
                    <td className="px-6 py-3">
                      <button
                        onClick={() => { setNewAdjustment({ product: item.productId, batch: item.batch, type: '', quantity: '', reason: '' }); setShowAdjustmentModal(true); }}
                        className="text-primary-600 hover:text-primary-700 font-medium text-xs"
                      >
                        Adjust
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-400">
                    <Package className="w-10 h-10 mx-auto mb-2 opacity-40" />
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
              <button onClick={() => setShowAdjustmentModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            {adjustmentError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">{adjustmentError}</div>
            )}
            <div className="space-y-4">
              <div>
                <label htmlFor="product-select" className="block text-sm font-medium text-gray-700 mb-1">Product *</label>
                <select
                  id="product-select"
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
                <label htmlFor="batch-select" className="block text-sm font-medium text-gray-700 mb-1">Batch *</label>
                <select
                  id="batch-select"
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
                <label htmlFor="type-select" className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                <select
                  id="type-select"
                  className="input-field"
                  value={newAdjustment.type}
                  onChange={(e) => setNewAdjustment({ ...newAdjustment, type: e.target.value })}
                >
                  <option value="">Select type</option>
                  <option>Damage</option>
                  <option>Expiry</option>
                  <option>Correction (Positive)</option>
                  <option>Correction (Negative)</option>
                  <option>Transfer In</option>
                  <option>Transfer Out</option>
                </select>
              </div>
              <div>
                <label htmlFor="quantity-input" className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                <input
                  id="quantity-input"
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
