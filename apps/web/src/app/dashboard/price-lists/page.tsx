'use client';

import { useState, useEffect } from 'react';
import { PriceListsService } from '@bharatsales/api-client';
import { PriceList, PriceListItem } from '@bharatsales/shared-types';
import { Loader2 } from 'lucide-react';

export default function PriceListsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);
  const [prices, setPrices] = useState<PriceListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [lists, items] = await Promise.all([
        PriceListsService.getPriceLists('org-1'),
        PriceListsService.getPriceListItems('org-1')
      ]);
      setPriceLists(lists || []);
      setPrices(items || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPrices = prices.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleImportPrices = () => {
    setSuccessMessage('Price import started! You will be notified when complete.');
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
        <div><h1 className="text-2xl font-bold text-gray-900">Price Lists</h1><p className="text-gray-500">Manage pricing for different channels</p></div>
        <button onClick={handleImportPrices} className="btn-primary text-sm">📥 Import Prices</button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <div className="col-span-full flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
          </div>
        ) : priceLists.map((list) => (
          <div key={list.name} className="card-hover">
            <div className="flex items-center justify-between mb-2"><span className="font-medium text-gray-900 text-sm">{list.name}</span><span className="w-2 h-2 bg-green-500 rounded-full"></span></div>
            <div className="text-xs text-gray-500 space-y-1"><div>Type: {list.type}</div><div>Scope: {list.outlets}</div><div>{list.products} products</div></div>
          </div>
        ))}
      </div>

      <div className="card"><input type="text" placeholder="Search products..." className="input-field w-full max-w-md" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50"><tr className="text-left text-gray-500"><th className="px-6 py-3 font-medium">SKU</th><th className="px-6 py-3 font-medium">Product</th><th className="px-6 py-3 font-medium">MRP</th><th className="px-6 py-3 font-medium">Standard</th><th className="px-6 py-3 font-medium">Wholesale</th><th className="px-6 py-3 font-medium">Tier A</th><th className="px-6 py-3 font-medium">Min Price</th></tr></thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></td>
                </tr>
              ) : filteredPrices.length > 0 ? (
                filteredPrices.map((price) => (
                  <tr key={price.sku} className="border-t border-gray-100">
                    <td className="px-6 py-3 font-medium text-primary-600">{price.sku}</td>
                    <td className="px-6 py-3 text-gray-900">{price.name}</td>
                    <td className="px-6 py-3 text-gray-600">₹{price.mrp}</td>
                    <td className="px-6 py-3 font-medium text-gray-900">₹{price.standard}</td>
                    <td className="px-6 py-3 text-gray-600">₹{price.wholesale}</td>
                    <td className="px-6 py-3 text-gray-600">₹{price.tierA}</td>
                    <td className="px-6 py-3 text-red-600">₹{price.minPrice}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">No prices found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
