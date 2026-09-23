import type { LucideIcon } from 'lucide-react';
import { Shield, ShieldAlert, Users, Target, Truck } from 'lucide-react';
import { Alert, Badge, Card, PageHeader, PageSection, cn } from '@bharatsales/ui';

interface RoleDefinition {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  scope: string;
  icon: LucideIcon;
  iconClass: string;
}

const PREDEFINED_ROLES: RoleDefinition[] = [
  {
    id: 'super-admin',
    name: 'Super Admin',
    description: 'Full platform access, multi-tenant management, global settings.',
    permissions: ['All permissions'],
    scope: 'Global',
    icon: ShieldAlert,
    iconClass: 'bg-danger-50 text-danger-600',
  },
  {
    id: 'org-admin',
    name: 'Organization Admin',
    description: 'Top-level access for a specific organization, billing, and settings.',
    permissions: ['Org settings', 'Users', 'Billing'],
    scope: 'Organization',
    icon: Shield,
    iconClass: 'bg-primary-50 text-primary-600',
  },
  {
    id: 'sales-manager',
    name: 'Sales Manager',
    description: 'Team management, target setting, and approval workflows.',
    permissions: ['Team', 'Targets', 'Approvals'],
    scope: 'Hierarchy node',
    icon: Target,
    iconClass: 'bg-info-50 text-info-600',
  },
  {
    id: 'sales-rep',
    name: 'Sales Representative',
    description: 'Field execution, store visits, order taking.',
    permissions: ['Visits', 'Orders', 'Outlets'],
    scope: 'Assigned territory',
    icon: Users,
    iconClass: 'bg-success-50 text-success-600',
  },
  {
    id: 'distributor',
    name: 'Distributor',
    description: 'Inventory management, order fulfillment, and dispatch.',
    permissions: ['Inventory', 'Dispatch', 'Returns'],
    scope: 'Assigned outlets',
    icon: Truck,
    iconClass: 'bg-saffron-100 text-saffron-700',
  },
];

export default function RolesPage() {
  return (
    <PageSection>
      <PageHeader title="Roles & permissions" description="The predefined roles in your organization and what each can access." />

      <Alert tone="info" title="Fixed role model">
        Your organization uses predefined roles, so custom roles can’t be created. Assign one of these roles when you invite
        someone from the Team page.
      </Alert>

      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-label="Roles">
        {PREDEFINED_ROLES.map((role) => {
          const Icon = role.icon;
          return (
            <li key={role.id}>
              <Card className="flex h-full flex-col p-4">
                <div className="flex items-center gap-3">
                  <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', role.iconClass)} aria-hidden="true">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h2 className="text-base font-semibold text-gray-900">{role.name}</h2>
                </div>
                <p className="mt-3 flex-grow text-sm text-foreground-muted">{role.description}</p>
                <dl className="mt-4 space-y-3 border-t border-border pt-4 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-foreground-subtle">Scope</dt>
                    <dd className="font-medium text-gray-900">{role.scope}</dd>
                  </div>
                  <div>
                    <dt className="mb-2 text-foreground-subtle">Key permissions</dt>
                    <dd className="flex flex-wrap gap-1.5">
                      {role.permissions.map((p) => (
                        <Badge key={p} tone="neutral" size="sm">
                          {p}
                        </Badge>
                      ))}
                    </dd>
                  </div>
                </dl>
              </Card>
            </li>
          );
        })}
      </ul>
    </PageSection>
  );
}
