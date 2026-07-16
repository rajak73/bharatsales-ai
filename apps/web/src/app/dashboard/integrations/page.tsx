'use client';

import { useState, useEffect } from 'react';
import { IntegrationsService } from '@bharatsales/api-client';
import { Integration } from '@bharatsales/shared-types';
import { Loader2 } from 'lucide-react';

export default function IntegrationsPage() {
  const [successMessage, setSuccessMessage] = useState('');
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await IntegrationsService.getIntegrations('org-1');
      setIntegrations(data || []);
    } catch (error) {
      console.error('Failed to fetch integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigure = (name: string) => {
    setSuccessMessage(`Configuration for ${name} updated!`);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleRotateKey = () => {
    setSuccessMessage('API key rotated successfully!');
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

      <div><h1 className="text-2xl font-bold text-gray-900">Integrations</h1><p className="text-gray-500">Configure third-party integrations and APIs</p></div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {integrations.map((integration) => (
            <div key={integration.name} className="card-hover">
              <div className="flex items-center justify-between mb-3">
                <span className={`px-2 py-1 rounded text-xs font-medium ${integration.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{integration.status}</span>
                <button onClick={() => handleConfigure(integration.name)} className="text-primary-600 text-xs font-medium">Configure</button>
              </div>
              <h3 className="font-bold text-gray-900 mb-1">{integration.name}</h3>
              <p className="text-xs text-gray-500 mb-2">Provider: {integration.provider}</p>
              <p className="text-xs text-gray-400">{integration.purpose}</p>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <h3 className="font-bold text-gray-900 mb-4">API Keys</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div><div className="text-sm font-medium text-gray-900">Production API Key</div><div className="text-xs text-gray-500 font-mono">bs_live_****...****a3f2</div></div>
            <div className="flex space-x-2"><button className="text-primary-600 text-xs font-medium">Reveal</button><button onClick={handleRotateKey} className="text-red-600 text-xs font-medium">Rotate</button></div>
          </div>
        </div>
      </div>
    </div>
  );
}
