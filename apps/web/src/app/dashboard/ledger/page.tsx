'use client';

import { useState, useEffect } from 'react';
import { FinanceService, OutletsService } from '@bharatsales/api-client';
import { LedgerEntry, Outlet } from '@bharatsales/shared-types';
import { Loader2, Search, FileText, ArrowDownRight, ArrowUpRight, BookOpen } from 'lucide-react';

export default function LedgerPage() {
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [selectedOutletId, setSelectedOutletId] = useState<string>('');
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchOutlets();
  }, []);

  useEffect(() => {
    if (selectedOutletId) {
      fetchLedger(selectedOutletId);
    } else {
      setLedger([]);
    }
  }, [selectedOutletId]);

  const fetchOutlets = async () => {
    try {
      setInitialLoading(true);
      const data = await OutletsService.getOutlets();
      setOutlets(data || []);
      if (data && data.length > 0) {
        setSelectedOutletId(data[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch outlets:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const fetchLedger = async (outletId: string) => {
    try {
      setLoading(true);
      const data = await FinanceService.getLedger(outletId);
      setLedger(data || []);
    } catch (error) {
      console.error('Failed to fetch ledger:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOutlets = outlets.filter(outlet => 
    outlet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    outlet.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Invoice': return 'text-red-600 bg-red-50';
      case 'Collection': return 'text-green-600 bg-green-50';
      case 'Reversal': return 'text-orange-600 bg-orange-50';
      case 'Bounced': return 'text-purple-600 bg-purple-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <BookOpen className="w-6 h-6 mr-2 text-primary-600" />
            Account Ledger
          </h1>
          <p className="text-gray-500">View chronological debit and credit history</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar: Outlet Selection */}
        <div className="lg:col-span-1 space-y-4">
          <div className="card p-4 h-[600px] flex flex-col">
            <h3 className="font-semibold text-gray-900 mb-4">Select Outlet</h3>
            <div className="relative mb-4">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search outlets..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {filteredOutlets.map(outlet => (
                <button
                  key={outlet.id}
                  onClick={() => setSelectedOutletId(outlet.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                    selectedOutletId === outlet.id 
                      ? 'border-primary-500 bg-primary-50' 
                      : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium text-gray-900 truncate">{outlet.name}</div>
                  <div className="text-xs text-gray-500 mt-1 flex justify-between">
                    <span>{outlet.code || 'No Code'}</span>
                    <span className="font-semibold text-primary-600">₹{outlet.commercial?.outstandingBalance || 0}</span>
                  </div>
                </button>
              ))}
              {filteredOutlets.length === 0 && (
                <div className="text-center text-sm text-gray-500 py-4">No outlets found</div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content: Ledger Table */}
        <div className="lg:col-span-3">
          <div className="card h-[600px] flex flex-col">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
              <h3 className="font-semibold text-gray-900">
                {outlets.find(o => o.id === selectedOutletId)?.name || 'Ledger'}
              </h3>
              <div className="text-sm font-medium">
                Current Outstanding: <span className="text-primary-600 text-lg">
                  ₹{outlets.find(o => o.id === selectedOutletId)?.commercial?.outstandingBalance || 0}
                </span>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto p-0">
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
                </div>
              ) : ledger.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <FileText className="w-12 h-12 text-gray-300 mb-2" />
                  <p>No transactions found for this outlet.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-white shadow-sm z-10">
                    <tr className="border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase bg-gray-50">
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3">Reference</th>
                      <th className="px-6 py-3">Type</th>
                      <th className="px-6 py-3 text-right">Debit (Dr)</th>
                      <th className="px-6 py-3 text-right">Credit (Cr)</th>
                      <th className="px-6 py-3 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {ledger.map((entry) => (
                      <tr key={entry.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(entry.date).toLocaleDateString()} <span className="text-xs text-gray-400">{new Date(entry.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-medium text-gray-900">{entry.reference}</span>
                          <div className="text-xs text-gray-400">{entry.status}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getTypeColor(entry.type)}`}>
                            {entry.type === 'Invoice' ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                            {entry.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-red-600">
                          {entry.debit > 0 ? `₹${entry.debit.toFixed(2)}` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-green-600">
                          {entry.credit > 0 ? `₹${entry.credit.toFixed(2)}` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-900">
                          ₹{entry.runningBalance.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
