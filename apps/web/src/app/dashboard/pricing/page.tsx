'use client';

import { useState, useEffect } from 'react';
import { SchemesService, TaxRatesService, PriceListsService } from '@bharatsales/api-client';
import type { Scheme, TaxRate, PriceList } from '@bharatsales/shared-types';
import { Loader2, CheckCircle, X, Plus } from 'lucide-react';

type Tab = 'schemes' | 'taxRates' | 'priceLists';

const EMPTY_SCHEME = {
  name: '', description: '', type: 'PERCENTAGE_DISCOUNT' as 'PERCENTAGE_DISCOUNT' | 'FREE_ITEM',
  isActive: true, minQuantity: 0, minOrderValue: 0, discountPercentage: '', freeProductId: '', freeQuantity: '',
  validFrom: '', validUntil: '',
};
const EMPTY_TAX_RATE = { name: '', percentage: '', country: 'India', region: '' };
const EMPTY_PRICE_LIST = { name: '', type: 'Customer' as 'Customer' | 'Customer Group', status: 'Active' as 'Active' | 'Inactive', validFrom: '', validTo: '' };

export default function PricingPage() {
  const [tab, setTab] = useState<Tab>('schemes');
  const [role, setRole] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [actionError, setActionError] = useState('');

  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);
  const [loading, setLoading] = useState(true);

  const [schemeForm, setSchemeForm] = useState<any>(null); // non-null while modal open; null = closed. Has `_id` when editing.
  const [taxRateForm, setTaxRateForm] = useState<any>(null);
  const [priceListForm, setPriceListForm] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const canManage = role === 'Organization Admin';

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [s, t, p] = await Promise.all([
        SchemesService.getSchemes().catch(() => []),
        TaxRatesService.getTaxRates().catch(() => []),
        PriceListsService.getPriceLists().catch(() => []),
      ]);
      setSchemes(s);
      setTaxRates(t);
      setPriceLists(p);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    try {
      const token = localStorage.getItem('bharatsales_token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setRole(payload.role);
      }
    } catch {
      // ignore
    }
  }, []);

  const flash = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleSaveScheme = async () => {
    if (!schemeForm.name || !schemeForm.validFrom || !schemeForm.validUntil) return;
    setSaving(true);
    setActionError('');
    try {
      const payload = {
        name: schemeForm.name,
        description: schemeForm.description,
        type: schemeForm.type,
        isActive: schemeForm.isActive,
        applicableProductIds: [],
        minQuantity: Number(schemeForm.minQuantity) || 0,
        minOrderValue: Number(schemeForm.minOrderValue) || 0,
        discountPercentage: schemeForm.discountPercentage ? Number(schemeForm.discountPercentage) : undefined,
        freeProductId: schemeForm.freeProductId || undefined,
        freeQuantity: schemeForm.freeQuantity ? Number(schemeForm.freeQuantity) : undefined,
        validFrom: schemeForm.validFrom,
        validUntil: schemeForm.validUntil,
      };
      if (schemeForm._id) {
        await SchemesService.updateScheme(schemeForm._id, payload as any);
      } else {
        await SchemesService.createScheme(payload as any);
      }
      flash(`Scheme "${schemeForm.name}" saved.`);
      setSchemeForm(null);
      fetchAll();
    } catch (err: any) {
      setActionError(err?.response?.data?.message || 'Failed to save scheme.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteScheme = async (id: string) => {
    try {
      await SchemesService.deleteScheme(id);
      flash('Scheme deleted.');
      fetchAll();
    } catch (err: any) {
      setActionError(err?.response?.data?.message || 'Failed to delete scheme.');
    }
  };

  const handleSaveTaxRate = async () => {
    if (!taxRateForm.name || !taxRateForm.percentage || !taxRateForm.country) return;
    setSaving(true);
    setActionError('');
    try {
      const payload = {
        name: taxRateForm.name,
        percentage: Number(taxRateForm.percentage),
        country: taxRateForm.country,
        region: taxRateForm.region || undefined,
      };
      if (taxRateForm._id) {
        await TaxRatesService.updateTaxRate(taxRateForm._id, payload as any);
      } else {
        await TaxRatesService.createTaxRate(payload as any);
      }
      flash(`Tax rate "${taxRateForm.name}" saved.`);
      setTaxRateForm(null);
      fetchAll();
    } catch (err: any) {
      setActionError(err?.response?.data?.message || 'Failed to save tax rate.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTaxRate = async (id: string) => {
    try {
      await TaxRatesService.deleteTaxRate(id);
      flash('Tax rate deleted.');
      fetchAll();
    } catch (err: any) {
      setActionError(err?.response?.data?.message || 'Failed to delete tax rate.');
    }
  };

  const handleSavePriceList = async () => {
    if (!priceListForm.name || !priceListForm.validFrom) return;
    setSaving(true);
    setActionError('');
    try {
      const payload = {
        name: priceListForm.name,
        type: priceListForm.type,
        status: priceListForm.status,
        validFrom: priceListForm.validFrom,
        validTo: priceListForm.validTo || undefined,
        pricingRules: priceListForm.pricingRules || {},
      };
      if (priceListForm._id) {
        await PriceListsService.updatePriceList(priceListForm._id, payload as any);
      } else {
        await PriceListsService.createPriceList(payload as any);
      }
      flash(`Price list "${priceListForm.name}" saved.`);
      setPriceListForm(null);
      fetchAll();
    } catch (err: any) {
      setActionError(err?.response?.data?.message || 'Failed to save price list.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePriceList = async (id: string) => {
    try {
      await PriceListsService.deletePriceList(id);
      flash('Price list deleted.');
      fetchAll();
    } catch (err: any) {
      setActionError(err?.response?.data?.message || 'Failed to delete price list.');
    }
  };

  return (
    <div className="space-y-6">
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-800 font-medium">{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage('')} className="text-green-600 hover:text-green-800"><X className="w-4 h-4" /></button>
        </div>
      )}
      {actionError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
          <span className="text-sm text-red-700 font-medium">{actionError}</span>
          <button onClick={() => setActionError('')} className="text-red-600 hover:text-red-800"><X className="w-4 h-4" /></button>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pricing & Schemes</h1>
        <p className="text-gray-500">Manage discount schemes, tax rates, and customer price lists.</p>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        {([
          { key: 'schemes', label: `Schemes (${schemes.length})` },
          { key: 'taxRates', label: `Tax Rates (${taxRates.length})` },
          { key: 'priceLists', label: `Price Lists (${priceLists.length})` },
        ] as { key: Tab; label: string }[]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>
      ) : (
        <>
          {tab === 'schemes' && (
            <div className="card overflow-hidden p-0">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-900">Discount Schemes</h3>
                {canManage && (
                  <button onClick={() => setSchemeForm({ ...EMPTY_SCHEME })} className="btn-primary text-sm flex items-center gap-1"><Plus className="w-4 h-4" /> New Scheme</button>
                )}
              </div>
              <div className="divide-y divide-gray-100">
                {schemes.length === 0 ? (
                  <div className="p-12 text-center text-gray-400 text-sm">No schemes yet.</div>
                ) : schemes.map((s: any) => (
                  <div key={s.id} className="p-4 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{s.name} <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${s.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{s.isActive ? 'Active' : 'Inactive'}</span></div>
                      <div className="text-sm text-gray-500">{s.description}</div>
                      <div className="text-xs text-gray-400 mt-1">{s.type === 'PERCENTAGE_DISCOUNT' ? `${s.discountPercentage}% off` : `Free ${s.freeQuantity} item(s)`} • min qty {s.minQuantity} • min order ₹{s.minOrderValue} • valid {s.validFrom} to {s.validUntil}</div>
                    </div>
                    {canManage && (
                      <div className="flex gap-3 text-sm">
                        <button onClick={() => setSchemeForm({ ...s, _id: s.id })} className="text-primary-600 hover:text-primary-700 font-medium">Edit</button>
                        <button onClick={() => handleDeleteScheme(s.id)} className="text-red-600 hover:text-red-700 font-medium">Delete</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'taxRates' && (
            <div className="card overflow-hidden p-0">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-900">Tax Rates</h3>
                {canManage && (
                  <button onClick={() => setTaxRateForm({ ...EMPTY_TAX_RATE })} className="btn-primary text-sm flex items-center gap-1"><Plus className="w-4 h-4" /> New Tax Rate</button>
                )}
              </div>
              <div className="divide-y divide-gray-100">
                {taxRates.length === 0 ? (
                  <div className="p-12 text-center text-gray-400 text-sm">No tax rates yet.</div>
                ) : taxRates.map((t: any) => (
                  <div key={t.id} className="p-4 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{t.name} — {t.percentage}%</div>
                      <div className="text-sm text-gray-500">{t.country}{t.region ? ` • ${t.region}` : ''}</div>
                    </div>
                    {canManage && (
                      <div className="flex gap-3 text-sm">
                        <button onClick={() => setTaxRateForm({ ...t, _id: t.id })} className="text-primary-600 hover:text-primary-700 font-medium">Edit</button>
                        <button onClick={() => handleDeleteTaxRate(t.id)} className="text-red-600 hover:text-red-700 font-medium">Delete</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'priceLists' && (
            <div className="card overflow-hidden p-0">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-900">Price Lists</h3>
                {canManage && (
                  <button onClick={() => setPriceListForm({ ...EMPTY_PRICE_LIST })} className="btn-primary text-sm flex items-center gap-1"><Plus className="w-4 h-4" /> New Price List</button>
                )}
              </div>
              <div className="divide-y divide-gray-100">
                {priceLists.length === 0 ? (
                  <div className="p-12 text-center text-gray-400 text-sm">No price lists yet.</div>
                ) : priceLists.map((p: any) => (
                  <div key={p.id} className="p-4 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{p.name} <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${p.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{p.status}</span></div>
                      <div className="text-sm text-gray-500">{p.type} • valid {p.validFrom}{p.validTo ? ` to ${p.validTo}` : ' onward'}</div>
                    </div>
                    {canManage && (
                      <div className="flex gap-3 text-sm">
                        <button onClick={() => setPriceListForm({ ...p, _id: p.id })} className="text-primary-600 hover:text-primary-700 font-medium">Edit</button>
                        <button onClick={() => handleDeletePriceList(p.id)} className="text-red-600 hover:text-red-700 font-medium">Delete</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Scheme Modal */}
      {schemeForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">{schemeForm._id ? 'Edit Scheme' : 'New Scheme'}</h3>
              <button onClick={() => setSchemeForm(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Name *</label><input className="input-field" value={schemeForm.name} onChange={e => setSchemeForm({ ...schemeForm, name: e.target.value })} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><input className="input-field" value={schemeForm.description} onChange={e => setSchemeForm({ ...schemeForm, description: e.target.value })} /></div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select className="input-field" value={schemeForm.type} onChange={e => setSchemeForm({ ...schemeForm, type: e.target.value })}>
                  <option value="PERCENTAGE_DISCOUNT">Percentage Discount</option>
                  <option value="FREE_ITEM">Free Item</option>
                </select>
              </div>
              {schemeForm.type === 'PERCENTAGE_DISCOUNT' ? (
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Discount %</label><input type="number" className="input-field" value={schemeForm.discountPercentage} onChange={e => setSchemeForm({ ...schemeForm, discountPercentage: e.target.value })} /></div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Free Product ID</label><input className="input-field" value={schemeForm.freeProductId} onChange={e => setSchemeForm({ ...schemeForm, freeProductId: e.target.value })} /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Free Qty</label><input type="number" className="input-field" value={schemeForm.freeQuantity} onChange={e => setSchemeForm({ ...schemeForm, freeQuantity: e.target.value })} /></div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Min Quantity</label><input type="number" className="input-field" value={schemeForm.minQuantity} onChange={e => setSchemeForm({ ...schemeForm, minQuantity: e.target.value })} /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Min Order Value</label><input type="number" className="input-field" value={schemeForm.minOrderValue} onChange={e => setSchemeForm({ ...schemeForm, minOrderValue: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Valid From *</label><input type="date" className="input-field" value={schemeForm.validFrom} onChange={e => setSchemeForm({ ...schemeForm, validFrom: e.target.value })} /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Valid Until *</label><input type="date" className="input-field" value={schemeForm.validUntil} onChange={e => setSchemeForm({ ...schemeForm, validUntil: e.target.value })} /></div>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={schemeForm.isActive} onChange={e => setSchemeForm({ ...schemeForm, isActive: e.target.checked })} /> Active
              </label>
            </div>
            <div className="flex space-x-3 mt-6">
              <button onClick={() => setSchemeForm(null)} className="flex-1 btn-secondary">Cancel</button>
              <button onClick={handleSaveScheme} disabled={saving || !schemeForm.name || !schemeForm.validFrom || !schemeForm.validUntil} className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed">{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Tax Rate Modal */}
      {taxRateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">{taxRateForm._id ? 'Edit Tax Rate' : 'New Tax Rate'}</h3>
              <button onClick={() => setTaxRateForm(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Name *</label><input className="input-field" placeholder="e.g. GST 18%" value={taxRateForm.name} onChange={e => setTaxRateForm({ ...taxRateForm, name: e.target.value })} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Percentage *</label><input type="number" className="input-field" value={taxRateForm.percentage} onChange={e => setTaxRateForm({ ...taxRateForm, percentage: e.target.value })} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Country *</label><input className="input-field" value={taxRateForm.country} onChange={e => setTaxRateForm({ ...taxRateForm, country: e.target.value })} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Region</label><input className="input-field" value={taxRateForm.region} onChange={e => setTaxRateForm({ ...taxRateForm, region: e.target.value })} /></div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button onClick={() => setTaxRateForm(null)} className="flex-1 btn-secondary">Cancel</button>
              <button onClick={handleSaveTaxRate} disabled={saving || !taxRateForm.name || !taxRateForm.percentage || !taxRateForm.country} className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed">{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Price List Modal */}
      {priceListForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">{priceListForm._id ? 'Edit Price List' : 'New Price List'}</h3>
              <button onClick={() => setPriceListForm(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Name *</label><input className="input-field" value={priceListForm.name} onChange={e => setPriceListForm({ ...priceListForm, name: e.target.value })} /></div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select className="input-field" value={priceListForm.type} onChange={e => setPriceListForm({ ...priceListForm, type: e.target.value })}>
                  <option value="Customer">Customer</option>
                  <option value="Customer Group">Customer Group</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select className="input-field" value={priceListForm.status} onChange={e => setPriceListForm({ ...priceListForm, status: e.target.value })}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Valid From *</label><input type="date" className="input-field" value={priceListForm.validFrom} onChange={e => setPriceListForm({ ...priceListForm, validFrom: e.target.value })} /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Valid To</label><input type="date" className="input-field" value={priceListForm.validTo} onChange={e => setPriceListForm({ ...priceListForm, validTo: e.target.value })} /></div>
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button onClick={() => setPriceListForm(null)} className="flex-1 btn-secondary">Cancel</button>
              <button onClick={handleSavePriceList} disabled={saving || !priceListForm.name || !priceListForm.validFrom} className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed">{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
