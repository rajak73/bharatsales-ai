'use client';

import { useState, useEffect } from 'react';
import { Card, Button } from '@bharatsales/ui';
import { OutletsService } from '@bharatsales/api-client';
import { Outlet } from '@bharatsales/shared-types';
import { Plus, Search, MapPin, Phone, MoreVertical, Store, Loader2 } from 'lucide-react';

export default function OutletsPage() {
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchOutlets();
  }, []);

  const fetchOutlets = async () => {
    try {
      setLoading(true);
      const data = await OutletsService.getOutlets();
      setOutlets(data);
    } catch (error) {
      console.error('Failed to fetch outlets:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOutlets = outlets.filter(o => 
    o.name.toLowerCase().includes(search.toLowerCase()) || 
    (o.ownerName && o.ownerName.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Outlets</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your retail store network across all territories.</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Outlet
        </Button>
      </div>

      <Card>
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search outlets by name or owner..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 w-full rounded-lg border-gray-200 focus:border-primary-500 focus:ring-primary-500 sm:text-sm h-10 border"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : filteredOutlets.length === 0 ? (
          <div className="text-center py-12">
            <Store className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">No outlets found</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new outlet.</p>
            <div className="mt-6">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Outlet
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Store</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOutlets.map((outlet) => (
                  <tr key={outlet.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 bg-primary-100 rounded-lg flex items-center justify-center">
                          <Store className="h-5 w-5 text-primary-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{outlet.name}</div>
                          <div className="text-sm text-gray-500">ID: {outlet.id.slice(-6).toUpperCase()}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center">
                        <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                        {outlet.location?.latitude?.toFixed(4) ?? '0.0000'}, {outlet.location?.longitude?.toFixed(4) ?? '0.0000'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center">
                        {outlet.mobile ? (
                          <><Phone className="w-4 h-4 mr-1 text-gray-400" />{outlet.mobile}</>
                        ) : (
                          <span className="text-gray-400 italic">No mobile</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">{outlet.ownerName || 'Unknown Owner'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        outlet.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {outlet.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-gray-400 hover:text-gray-600">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
