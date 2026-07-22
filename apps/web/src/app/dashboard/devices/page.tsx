'use client';

import { useState, useEffect } from 'react';
import { DevicesService, AuthService } from '@bharatsales/api-client';
import { Device, Session } from '@bharatsales/shared-types';
import { Loader2 } from 'lucide-react';

export default function DevicesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  const [devices, setDevices] = useState<Device[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [devicesData, backendSessions] = await Promise.all([
        DevicesService.getDevices(),
        AuthService.getActiveSessions()
      ]);
      setDevices(devicesData || []);
      
      const mappedSessions: Session[] = (backendSessions || []).map((s: any) => ({
        id: s._id,
        user: s.userId,
        device: s.deviceInfo || 'Unknown Device',
        ip: s.ipAddress || 'Unknown IP',
        loginTime: new Date(s.createdAt).toLocaleString(),
        lastActive: new Date(s.updatedAt).toLocaleString(),
        status: new Date(s.expiresAt) > new Date() ? 'Active' : 'Expired'
      }));
      setSessions(mappedSessions);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDevices = devices.filter(d =>
    d.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.model.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRevokeDevice = (id: string) => {
    setDevices(devices.filter(d => d.id !== id));
    setSuccessMessage('Device access revoked successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleLogoutSession = async (id: string) => {
    try {
      await AuthService.revokeSession(id);
      setSessions(sessions.filter(s => s.id !== id));
      setSuccessMessage(`Session revoked successfully.`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-green-600">✅</span>
            <span className="text-sm text-green-800 font-medium">{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage('')} className="text-green-600 hover:text-green-800">✕</button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Device & Session Management</h1>
          <p className="text-gray-500">Monitor active sessions and registered devices</p>
        </div>
        <button onClick={() => setSuccessMessage('All other sessions have been logged out!')} className="btn-secondary text-sm">Logout All Devices</button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-600">{sessions.filter(s => s.status === 'Active').length}</div>
          <div className="text-sm text-gray-500">Active Sessions</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-yellow-600">{sessions.filter(s => s.status === 'Idle').length}</div>
          <div className="text-sm text-gray-500">Idle</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-gray-900">{devices.length}</div>
          <div className="text-sm text-gray-500">Registered Devices</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-red-600">{devices.filter(d => !d.trusted).length}</div>
          <div className="text-sm text-gray-500">Untrusted</div>
        </div>
      </div>

      <div className="card">
        <input
          type="text"
          placeholder="Search devices..."
          className="input-field w-full max-w-md"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Active Sessions */}
      <div className="card overflow-hidden p-0">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">Active Sessions</h3>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-gray-500">
                  <th className="px-6 py-3 font-medium">User ID</th>
                  <th className="px-6 py-3 font-medium">Device</th>
                  <th className="px-6 py-3 font-medium">IP Address</th>
                  <th className="px-6 py-3 font-medium">Login Time</th>
                  <th className="px-6 py-3 font-medium">Last Active</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {sessions.length > 0 ? (
                  sessions.map((session, idx) => (
                    <tr key={idx} className="border-t border-gray-100">
                      <td className="px-6 py-3 font-medium text-gray-900">{session.user}</td>
                      <td className="px-6 py-3 text-gray-600">{session.device}</td>
                      <td className="px-6 py-3 text-gray-500 font-mono text-xs">{session.ip}</td>
                      <td className="px-6 py-3 text-gray-500">{session.loginTime}</td>
                      <td className="px-6 py-3 text-gray-500">{session.lastActive}</td>
                      <td className="px-6 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${session.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {session.status}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        {session.status === 'Active' && (
                          <button onClick={() => handleLogoutSession(session.id)} className="text-red-600 text-xs font-medium hover:text-red-700">Logout</button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">No active sessions found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Registered Devices */}
      <div className="card overflow-hidden p-0">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">Registered Devices</h3>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-gray-500">
                  <th className="px-6 py-3 font-medium">Device ID</th>
                  <th className="px-6 py-3 font-medium">User</th>
                  <th className="px-6 py-3 font-medium">Model</th>
                  <th className="px-6 py-3 font-medium">OS</th>
                  <th className="px-6 py-3 font-medium">App Version</th>
                  <th className="px-6 py-3 font-medium">Last Sync</th>
                  <th className="px-6 py-3 font-medium">Trust</th>
                  <th className="px-6 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredDevices.length > 0 ? (
                  filteredDevices.map((device) => (
                    <tr key={device.id} className="border-t border-gray-100">
                      <td className="px-6 py-3 font-mono text-xs text-gray-600">{device.id}</td>
                      <td className="px-6 py-3 font-medium text-gray-900">{device.user}</td>
                      <td className="px-6 py-3 text-gray-600">{device.model}</td>
                      <td className="px-6 py-3 text-gray-600">{device.os}</td>
                      <td className="px-6 py-3 text-gray-600">{device.appVersion}</td>
                      <td className="px-6 py-3 text-gray-500">{device.lastSync}</td>
                      <td className="px-6 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${device.trusted ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {device.trusted ? 'Trusted' : 'Untrusted'}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        {device.trusted && (
                          <button onClick={() => handleRevokeDevice(device.id)} className="text-red-600 text-xs font-medium hover:text-red-700">Revoke</button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">No registered devices found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
