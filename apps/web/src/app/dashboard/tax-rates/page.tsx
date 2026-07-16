'use client';

import { useState, useEffect } from 'react';
import { TaxRatesService } from '@bharatsales/api-client';
import { TaxRate } from '@bharatsales/shared-types';
import { Loader2 } from 'lucide-react';

export default function TaxRatesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTaxRates();
  }, []);

  const fetchTaxRates = async () => {
    try {
      setLoading(true);
      const data = await TaxRatesService.getTaxRates('org-1');
      setTaxRates(data || []);
    } catch (error) {
      console.error('Failed to fetch tax rates:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRates = taxRates.filter(r => r.hsn.includes(searchTerm) || r.description.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleAddTaxRate = () => {
    setSuccessMessage('New tax rate added successfully!');
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
        <div><h1 className="text-2xl font-bold text-gray-900">HSN / GST & Tax Rates</h1><p className="text-gray-500">Manage tax rates with effective dating • {taxRates.length} rates</p></div>
        <button onClick={handleAddTaxRate} className="btn-primary text-sm">+ Add Tax Rate</button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-center space-x-2"><span>ℹ️</span><span className="text-sm text-blue-800"><strong>GST Rule:</strong> Intra-state supply applies CGST + SGST. Inter-state supply applies IGST.</span></div>
      </div>

      <div className="grid grid-cols-5 gap-4">
        <div className="card text-center"><div className="text-2xl font-bold text-gray-900">{taxRates.length}</div><div className="text-sm text-gray-500">Total HSN Codes</div></div>
        <div className="card text-center"><div className="text-2xl font-bold text-gray-900">{taxRates.filter(r => r.gst === '5%').length}</div><div className="text-sm text-gray-500">5% Rate</div></div>
        <div className="card text-center"><div className="text-2xl font-bold text-gray-900">{taxRates.filter(r => r.gst === '12%').length}</div><div className="text-sm text-gray-500">12% Rate</div></div>
        <div className="card text-center"><div className="text-2xl font-bold text-gray-900">{taxRates.filter(r => r.gst === '18%').length}</div><div className="text-sm text-gray-500">18% Rate</div></div>
        <div className="card text-center"><div className="text-2xl font-bold text-gray-900">{taxRates.filter(r => r.gst === '28%').length}</div><div className="text-sm text-gray-500">28% Rate</div></div>
      </div>

      <div className="card"><input type="text" placeholder="Search HSN..." className="input-field w-full max-w-md" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50"><tr className="text-left text-gray-500"><th className="px-6 py-3 font-medium">HSN Code</th><th className="px-6 py-3 font-medium">Description</th><th className="px-6 py-3 font-medium">GST</th><th className="px-6 py-3 font-medium">CGST</th><th className="px-6 py-3 font-medium">SGST</th><th className="px-6 py-3 font-medium">IGST</th><th className="px-6 py-3 font-medium">Effective From</th></tr></thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></td>
                </tr>
              ) : filteredRates.length > 0 ? (
                filteredRates.map((rate) => (
                  <tr key={rate.hsn} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium text-primary-600">{rate.hsn}</td>
                    <td className="px-6 py-3 text-gray-600">{rate.description}</td>
                    <td className="px-6 py-3"><span className={`px-2 py-1 rounded text-xs font-medium ${rate.gst === '0%' ? 'bg-gray-100 text-gray-700' : rate.gst === '5%' ? 'bg-green-100 text-green-700' : rate.gst === '12%' ? 'bg-blue-100 text-blue-700' : rate.gst === '18%' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{rate.gst}</span></td>
                    <td className="px-6 py-3 text-gray-600">{rate.cgst}</td>
                    <td className="px-6 py-3 text-gray-600">{rate.sgst}</td>
                    <td className="px-6 py-3 text-gray-600">{rate.igst}</td>
                    <td className="px-6 py-3 text-gray-500">{rate.effectiveFrom}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">No tax rates found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
