'use client';

import { useState, useEffect } from 'react';
import { SchemesService } from '@bharatsales/api-client';
import { Scheme } from '@bharatsales/shared-types';
import { Loader2 } from 'lucide-react';

export default function SchemesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [successMessage, setSuccessMessage] = useState('');
  
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchemes();
  }, []);

  const fetchSchemes = async () => {
    try {
      setLoading(true);
      const data = await SchemesService.getSchemes();
      setSchemes(data || []);
    } catch (error) {
      console.error('Failed to fetch schemes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSchemes = schemes.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'All Types' || s.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleCreateScheme = async () => {
    try {
      await SchemesService.createScheme({
        name: 'New Promotion',
        description: 'New promo desc',
        type: 'PERCENTAGE_DISCOUNT',
        isActive: true,
        applicableProductIds: [],
        minQuantity: 10,
        minOrderValue: 1000,
        discountPercentage: 5,
        validFrom: new Date().toISOString(),
        validUntil: new Date(Date.now() + 86400000 * 30).toISOString(),
      });
      setSuccessMessage('New scheme created successfully!');
      fetchSchemes();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error(err);
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
        <div><h1 className="text-2xl font-bold text-gray-900">Schemes</h1><p className="text-gray-500">Manage promotional schemes • {filteredSchemes.length} schemes</p></div>
        <div className="flex space-x-3">
          <select className="input-field w-32 text-sm" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}><option>All Types</option><option>Buy/Get</option><option>Slab Discount</option><option>SKU Bundle</option><option>Retailer Tier</option><option>Focus Incentive</option></select>
          <button onClick={handleCreateScheme} className="btn-primary text-sm">+ Create Scheme</button>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-3">
        {[{ type: 'Buy/Get', desc: 'Buy X, get Y free', icon: '🎁' }, { type: 'Slab Discount', desc: 'Value-based discount', icon: '📊' }, { type: 'SKU Bundle', desc: 'Combo product offers', icon: '📦' }, { type: 'Retailer Tier', desc: 'Tier-based benefits', icon: '⭐' }, { type: 'Focus Incentive', desc: 'SKU-specific incentive', icon: '🎯' }].map((scheme) => (
          <div key={scheme.type} className="card text-center p-4"><div className="text-2xl mb-1">{scheme.icon}</div><div className="text-sm font-medium text-gray-900">{scheme.type}</div><div className="text-xs text-gray-500">{scheme.desc}</div></div>
        ))}
      </div>

      <div className="card"><input type="text" placeholder="Search schemes..." className="input-field w-full max-w-md" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50"><tr className="text-left text-gray-500"><th className="px-6 py-3 font-medium">Scheme</th><th className="px-6 py-3 font-medium">Type</th><th className="px-6 py-3 font-medium">Product</th><th className="px-6 py-3 font-medium">Buy</th><th className="px-6 py-3 font-medium">Get</th><th className="px-6 py-3 font-medium">Channel</th><th className="px-6 py-3 font-medium">Period</th><th className="px-6 py-3 font-medium">Status</th></tr></thead>
            <tbody>
              {loading ? (
                 <tr>
                    <td colSpan={8} className="px-6 py-12 text-center flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></td>
                </tr>
              ) : filteredSchemes.length > 0 ? (
                filteredSchemes.map((scheme) => (
                  <tr key={scheme.id} className="border-t border-gray-100">
                    <td className="px-6 py-3 font-medium text-gray-900">{scheme.name}</td>
                    <td className="px-6 py-3"><span className="px-2 py-1 bg-primary-50 text-primary-700 rounded text-xs font-medium">{scheme.type}</span></td>
                    <td className="px-6 py-3 text-gray-600">{scheme.applicableProductIds?.length ? scheme.applicableProductIds.join(', ') : 'All'}</td>
                    <td className="px-6 py-3 text-gray-600">{scheme.minQuantity > 0 ? scheme.minQuantity : '-'}</td>
                    <td className="px-6 py-3 text-gray-600">{scheme.freeQuantity ? scheme.freeQuantity : '-'}</td>
                    <td className="px-6 py-3 text-gray-600">All</td>
                    <td className="px-6 py-3 text-gray-500 text-xs">{new Date(scheme.validFrom).toLocaleDateString()} - {new Date(scheme.validUntil).toLocaleDateString()}</td>
                    <td className="px-6 py-3"><span className={`px-2.5 py-1 rounded-full text-xs font-medium ${scheme.isActive ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{scheme.isActive ? 'Active' : 'Inactive'}</span></td>
                  </tr>
                ))
              ) : (
                <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">No schemes found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
