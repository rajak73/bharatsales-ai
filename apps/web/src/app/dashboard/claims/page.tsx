'use client';

import { useState, useEffect, useCallback } from 'react';
import { ClaimsService } from '@bharatsales/api-client';
import { Claim } from '@bharatsales/shared-types';
import { Loader2, Search, FileText, Check, X, ShieldAlert } from 'lucide-react';

export default function ClaimsPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState<{ role: string } | null>(null);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);

  const fetchClaims = useCallback(async () => {
    try {
      setLoading(true);
      const data = await ClaimsService.getClaims();
      setClaims(data || []);
      
      if (selectedClaim) {
        const updated = data?.find((c: Claim) => c.id === selectedClaim.id);
        if (updated) setSelectedClaim(updated);
      }
    } catch (error) {
      console.error('Failed to fetch claims:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedClaim]);

  useEffect(() => {
    try {
      const token = localStorage.getItem('bharatsales_token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({ role: payload.role });
      }
    } catch (e) {
      console.error(e);
    }
    fetchClaims();
  }, [fetchClaims]);

  const handleApprove = async (claimId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await ClaimsService.approveClaim(claimId, 'Approved by manager');
      await fetchClaims();
    } catch (error) {
      console.error('Failed to approve claim:', error);
      alert('Failed to approve claim. Please check permissions.');
    }
  };

  const handleReject = async (claimId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await ClaimsService.rejectClaim(claimId, 'Rejected by manager');
      await fetchClaims();
    } catch (error) {
      console.error('Failed to reject claim:', error);
      alert('Failed to reject claim. Please check permissions.');
    }
  };

  const filteredClaims = claims.filter(claim => 
    claim.claimNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    claim.type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: Claim['status']) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Approved': return 'bg-blue-100 text-blue-800';
      case 'Settled': return 'bg-green-100 text-green-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <ShieldAlert className="w-6 h-6 mr-2 text-primary-600" />
            Claims Management
          </h1>
          <p className="text-gray-500">Review and approve distributor claims</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="card p-4">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search claims by number or type..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase">
                      <th className="px-4 py-3">Claim Number</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredClaims.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                          <FileText className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                          No claims found.
                        </td>
                      </tr>
                    ) : (
                      filteredClaims.map((claim) => (
                        <tr 
                          key={claim.id} 
                          onClick={() => setSelectedClaim(claim)}
                          className={`hover:bg-gray-50 cursor-pointer ${selectedClaim?.id === claim.id ? 'bg-primary-50/50' : ''}`}
                        >
                          <td className="px-4 py-3 font-medium text-gray-900">{claim.claimNumber}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{claim.type}</td>
                          <td className="px-4 py-3 font-semibold text-gray-900">₹{claim.amount}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(claim.status)}`}>
                              {claim.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right space-x-2">
                            {claim.status === 'Pending' && (user?.role === 'Company Admin' || user?.role === 'National Sales Manager' || user?.role === 'Super Admin') && (
                              <>
                                <button
                                  onClick={(e) => handleApprove(claim.id, e)}
                                  className="p-1 rounded bg-green-100 text-green-700 hover:bg-green-200"
                                  title="Approve Claim"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={(e) => handleReject(claim.id, e)}
                                  className="p-1 rounded bg-red-100 text-red-700 hover:bg-red-200"
                                  title="Reject Claim"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            {selectedClaim ? (
              <div className="card sticky top-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{selectedClaim.claimNumber}</h3>
                    <p className="text-sm text-gray-500">{new Date(selectedClaim.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(selectedClaim.status)}`}>
                    {selectedClaim.status}
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500 text-sm">Type</span>
                    <span className="font-medium text-gray-900 text-sm">{selectedClaim.type}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500 text-sm">Amount</span>
                    <span className="font-bold text-gray-900">₹{selectedClaim.amount}</span>
                  </div>
                  {selectedClaim.referenceDocumentType && (
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-500 text-sm">Ref Type</span>
                      <span className="font-medium text-gray-900 text-sm">{selectedClaim.referenceDocumentType}</span>
                    </div>
                  )}
                  {selectedClaim.reason && (
                    <div className="py-2 border-b border-gray-100">
                      <span className="text-gray-500 text-sm block mb-1">Reason</span>
                      <span className="text-gray-900 text-sm">{selectedClaim.reason}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="card text-center py-12">
                <FileText className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-gray-900 font-medium mb-1">No Claim Selected</h3>
                <p className="text-sm text-gray-500">Select a claim from the list to view details</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
