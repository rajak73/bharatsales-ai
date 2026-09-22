import { useState, useEffect } from 'react';
import { SuperadminService } from '@bharatsales/api-client';
import { Users } from 'lucide-react';
import {
  Avatar,
  Button,
  DataTable,
  EmptyState,
  PageHeader,
  PageSection,
  SearchInput,
  Select,
  StatusPill,
  Toolbar,
  formatNumber,
} from '@bharatsales/ui';
import type { DataTableColumn } from '@bharatsales/ui';
import { ErrorState, getErrorMessage } from '../../../../components/common/ErrorState';

const ROLE_OPTIONS = ['All Roles', 'Super Admin', 'Organization Admin', 'Sales Manager', 'Sales Representative', 'Distributor'].map((r) => ({
  value: r,
  label: r === 'All Roles' ? 'All roles' : r,
}));

const columns: DataTableColumn<any>[] = [
  {
    id: 'name',
    header: 'Name',
    accessor: 'name',
    sortable: true,
    primary: true,
    cell: (u) => (
      <div className="flex min-w-0 items-center gap-3">
        <Avatar name={u.name} size="sm" />
        <div className="min-w-0">
          <div className="truncate font-medium text-gray-900">{u.name}</div>
          <div className="truncate text-xs text-foreground-subtle md:hidden">{u.email}</div>
        </div>
      </div>
    ),
  },
  { id: 'email', header: 'Email', accessor: 'email', sortable: true, hideBelow: 'md', hideInCard: true, cell: (u) => <span className="text-foreground-muted">{u.email}</span> },
  { id: 'role', header: 'Role', accessor: 'role', sortable: true },
  { id: 'org', header: 'Organization', accessor: 'organizationName', sortable: true, hideBelow: 'lg' },
  { id: 'status', header: 'Status', accessor: 'status', sortable: true, cell: (u) => <StatusPill status={u.status} size="sm" /> },
];

export default function GlobalUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All Roles');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setLoadError('');
      const data = await SuperadminService.getAllUsers();
      setUsers(data || []);
    } catch (error) {
      console.error('Failed to fetch global users:', error);
      setLoadError(getErrorMessage(error) ?? "Couldn't load users. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'All Roles' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const hasFilters = Boolean(searchTerm) || roleFilter !== 'All Roles';
  const clearFilters = () => {
    setSearchTerm('');
    setRoleFilter('All Roles');
  };

  return (
    <PageSection>
      <PageHeader
        title="Global users"
        description={
          loading && users.length === 0
            ? 'All users across every organization on the platform.'
            : `All users across every organization · ${formatNumber(filteredUsers.length)} ${hasFilters ? 'matching' : 'users'}`
        }
      />

      <DataTable
        caption="Users"
        itemLabel="users"
        data={filteredUsers}
        columns={columns}
        getRowId={(u, i) => u.id ?? String(i)}
        loading={loading && users.length === 0}
        error={loadError && <ErrorState title="Couldn't load users" message={loadError} onRetry={fetchUsers} className="border-0" />}
        initialSort={{ id: 'name', direction: 'asc' }}
        pagination={{ pageSize: 25 }}
        mobileLayout="cards"
        toolbar={
          <Toolbar>
            <SearchInput value={searchTerm} onValueChange={setSearchTerm} placeholder="Search by name or email…" aria-label="Search users" containerClassName="w-full sm:max-w-xs" />
            <div className="flex items-center gap-2">
              <Select hideLabel label="Role" options={ROLE_OPTIONS} value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} containerClassName="w-full sm:w-56" />
              {hasFilters && <Button variant="ghost" onClick={clearFilters}>Clear</Button>}
            </div>
          </Toolbar>
        }
        emptyState={
          hasFilters ? (
            <EmptyState size="compact" icon={<Users />} title="No users match" description="Try a different name, email or role." action={<Button variant="outline" onClick={clearFilters}>Clear filters</Button>} />
          ) : (
            <EmptyState size="compact" icon={<Users />} title="No users yet" description="Users appear here once organizations invite their teams." />
          )
        }
      />
    </PageSection>
  );
}
