'use client';

import { useState, useEffect } from 'react';
import { SuperadminService } from '@bharatsales/api-client';
import { Loader2 } from 'lucide-react';

export default function AuditLogsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    SuperadminService.getGlobalAuditLogs()
      .then(setEvents)
      .catch((err) => console.error('Failed to load audit logs:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
        <p className="text-gray-500">Platform-wide activity log across every organization.</p>
      </div>

      <div className="card overflow-hidden p-0">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-gray-500">
                  <th className="px-6 py-3 font-medium">Time</th>
                  <th className="px-6 py-3 font-medium">Actor</th>
                  <th className="px-6 py-3 font-medium">Action</th>
                  <th className="px-6 py-3 font-medium">Entity</th>
                  <th className="px-6 py-3 font-medium">Organization</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event, idx) => (
                  <tr key={idx} className="border-t border-gray-100">
                    <td className="px-6 py-3 text-gray-500">{new Date(event.timestamp).toLocaleString()}</td>
                    <td className="px-6 py-3 font-medium text-gray-900">{event.actorId}</td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${event.action?.includes('SUSPEND') ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                        {(event.action || '').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-600">{event.entityName}</td>
                    <td className="px-6 py-3 text-gray-500">{event.organizationId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {events.length === 0 && (
              <div className="text-center py-8 text-gray-500">No audit events recorded yet.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
