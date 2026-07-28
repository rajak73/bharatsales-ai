'use client';

import { useState } from 'react';

export default function IntegrationsPage() {
  const [configured, setConfigured] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
        <p className="text-gray-500">Manage third-party integrations and API connections</p>
      </div>
      
      {!configured ? (
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Tally ERP 9</h3>
              <p className="text-sm text-gray-500">Sync orders and invoices directly to Tally</p>
            </div>
            <button 
              onClick={() => setConfigured(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700"
            >
              Configure
            </button>
          </div>
        </div>
      ) : (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900">Configuration for Tally ERP 9</h3>
          <p className="text-sm text-gray-500 mb-4">Enter your Tally connection details below.</p>
          <button 
            onClick={() => setConfigured(false)}
            className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
