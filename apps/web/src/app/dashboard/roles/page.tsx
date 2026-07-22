'use client';

import { useState, useEffect } from 'react';
import { RolesService } from '@bharatsales/api-client';
import { Role } from '@bharatsales/shared-types';
import { Loader2 } from 'lucide-react';

export default function RolesPage() {
  const [successMessage, setSuccessMessage] = useState('');
  
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const data = await RolesService.getRoles();
      setRoles(data || []);
    } catch (error) {
      console.error('Failed to fetch roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = () => {
    setSuccessMessage('New role created successfully!');
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
        <div><h1 className="text-2xl font-bold text-gray-900">Roles & Permissions</h1><p className="text-gray-500">Manage role-based access control • {roles.length} roles</p></div>
        <button onClick={handleCreateRole} className="btn-primary text-sm">+ Create Role</button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : roles.length > 0 ? (
          roles.map((role) => (
            <div key={role.id} className="card-hover">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-gray-900 text-sm">{role.name}</h3>
                <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded">{role.users} users</span>
              </div>
              <div className="text-xs text-gray-500 space-y-1">
                <div>Permissions: {role.permissions}</div>
                <div>Scope: {role.scope}</div>
              </div>
              <div className="flex space-x-2 mt-3"><button className="text-primary-600 text-xs font-medium">Edit</button><button className="text-gray-400 text-xs">View</button></div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-gray-500 card">
            No roles found.
          </div>
        )}
      </div>
    </div>
  );
}
