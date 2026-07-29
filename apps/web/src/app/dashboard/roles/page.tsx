'use client';

import { Shield, ShieldAlert, Users, Target, Truck } from 'lucide-react';

const PREDEFINED_ROLES = [
  {
    id: 'super-admin',
    name: 'Super Admin',
    description: 'Full platform access, multi-tenant management, global settings.',
    permissions: 'All Permissions',
    scope: 'Global',
    icon: ShieldAlert,
    color: 'text-red-600',
    bg: 'bg-red-100',
  },
  {
    id: 'org-admin',
    name: 'Organization Admin',
    description: 'Top-level access for a specific organization, billing, and settings.',
    permissions: 'Org Settings, Users, Billing',
    scope: 'Organization',
    icon: Shield,
    color: 'text-primary-600',
    bg: 'bg-primary-100',
  },
  {
    id: 'sales-manager',
    name: 'Sales Manager',
    description: 'Team management, target setting, and approval workflows.',
    permissions: 'Team, Targets, Approvals',
    scope: 'Hierarchy Node',
    icon: Target,
    color: 'text-blue-600',
    bg: 'bg-blue-100',
  },
  {
    id: 'sales-rep',
    name: 'Sales Representative',
    description: 'Field execution, store visits, order taking.',
    permissions: 'Visits, Orders, Outlets',
    scope: 'Assigned Territory',
    icon: Users,
    color: 'text-green-600',
    bg: 'bg-green-100',
  },
  {
    id: 'distributor',
    name: 'Distributor',
    description: 'Inventory management, order fulfillment, and dispatch.',
    permissions: 'Inventory, Dispatch, Returns',
    scope: 'Assigned Outlets',
    icon: Truck,
    color: 'text-orange-600',
    bg: 'bg-orange-100',
  },
];

export default function RolesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Roles & Permissions</h1>
          <p className="text-gray-500">View predefined roles and access levels</p>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <h4 className="font-medium text-yellow-800 mb-1">Static RBAC Model</h4>
        <p className="text-sm text-yellow-700">
          This organization uses a strict, predefined Role-Based Access Control (RBAC) model. 
          Custom roles cannot be created dynamically. Please assign these predefined roles to your employees.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {PREDEFINED_ROLES.map((role) => {
          const Icon = role.icon;
          return (
            <div key={role.id} className="card-hover flex flex-col h-full">
              <div className="flex items-center space-x-3 mb-4">
                <div className={`p-2 rounded-lg ${role.bg} ${role.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-gray-900 text-lg">{role.name}</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4 flex-grow">
                {role.description}
              </p>
              <div className="space-y-2 pt-4 border-t border-gray-100">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Scope:</span>
                  <span className="font-medium text-gray-900">{role.scope}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Key Permissions:</span>
                  <span className="font-medium text-gray-900">{role.permissions}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
