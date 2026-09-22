import { useState, useEffect, useMemo } from 'react';
import { SuperadminService } from '@bharatsales/api-client';
import { ScrollText } from 'lucide-react';
import {
  Badge,
  DataTable,
  EmptyState,
  PageHeader,
  PageSection,
  SearchInput,
  Toolbar,
  formatDateTime,
} from '@bharatsales/ui';
import type { BadgeTone, DataTableColumn } from '@bharatsales/ui';
import { ErrorState, getErrorMessage } from '../../../../components/common/ErrorState';

const actionTone = (action: string | undefined): BadgeTone => {
  const a = (action || '').toUpperCase();
  if (a.includes('SUSPEND') || a.includes('DELETE') || a.includes('REVOKE')) return 'danger';
  if (a.includes('CREATE') || a.includes('ACTIVATE') || a.includes('APPROVE')) return 'success';
  return 'info';
};

/** Audit records carry `createdAt` (older ones may use `timestamp`). */
const eventTime = (e: any): string | undefined => e.timestamp ?? e.createdAt;

function buildColumns(userNames: Map<string, string>, orgNames: Map<string, string>): DataTableColumn<any>[] {
  const actorName = (e: any) => userNames.get(e.actorId) ?? e.actorId ?? '—';
  const orgName = (e: any) => orgNames.get(e.organizationId) ?? e.organizationId ?? '—';
  return [
    {
      id: 'timestamp',
      header: 'Time',
      accessor: (e) => new Date(eventTime(e) ?? '').getTime() || 0,
      sortable: true,
      searchable: false,
      cell: (e) => <span className="whitespace-nowrap text-foreground-muted tabular-nums">{formatDateTime(eventTime(e))}</span>,
    },
    {
      id: 'actor',
      header: 'Actor',
      accessor: (e) => `${actorName(e)} ${e.actorRole ?? ''}`,
      sortable: true,
      primary: true,
      sortFn: (a, b) => actorName(a).localeCompare(actorName(b), 'en-IN'),
      cell: (e) => (
        <div className="min-w-0">
          <div className="truncate font-medium text-gray-900">{actorName(e)}</div>
          {e.actorRole && <div className="truncate text-xs text-foreground-subtle">{e.actorRole}</div>}
        </div>
      ),
    },
    {
      id: 'action',
      header: 'Action',
      accessor: 'action',
      sortable: true,
      cell: (e) => (
        <Badge tone={actionTone(e.action)} size="sm" className="capitalize">
          {(e.action || '').replace(/_/g, ' ').toLowerCase()}
        </Badge>
      ),
    },
    { id: 'entity', header: 'Entity', accessor: 'entityName', sortable: true, hideBelow: 'md' },
    { id: 'org', header: 'Organization', accessor: orgName, sortable: true, hideBelow: 'lg', cell: (e) => <span className="text-foreground-muted">{orgName(e)}</span> },
  ];
}

export default function AuditLogsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [search, setSearch] = useState('');
  const [userNames, setUserNames] = useState<Map<string, string>>(new Map());
  const [orgNames, setOrgNames] = useState<Map<string, string>>(new Map());

  // Names are a nicety: if either lookup fails the table falls back to IDs.
  useEffect(() => {
    SuperadminService.getAllUsers()
      .then((users) => setUserNames(new Map(users.map((u: any) => [String(u.id ?? u._id), u.name]))))
      .catch((err) => console.warn('Audit logs: could not load user names', err));
    SuperadminService.getAllTenants()
      .then((orgs) => setOrgNames(new Map(orgs.map((o: any) => [String(o.id ?? o._id), o.name]))))
      .catch((err) => console.warn('Audit logs: could not load organization names', err));
  }, []);

  const columns = useMemo(() => buildColumns(userNames, orgNames), [userNames, orgNames]);

  useEffect(() => {
    setLoading(true);
    setLoadError('');
    SuperadminService.getGlobalAuditLogs()
      .then(setEvents)
      .catch((err) => {
        console.error('Failed to load audit logs:', err);
        setLoadError(getErrorMessage(err) ?? "Couldn't load audit logs. Check your connection and try again.");
      })
      .finally(() => setLoading(false));
  }, [reloadKey]);

  return (
    <PageSection>
      <PageHeader title="Audit logs" description="Platform-wide activity across every organization." />

      <DataTable
        caption="Audit events"
        itemLabel="events"
        data={events}
        columns={columns}
        getRowId={(e, i) => String(e.id ?? e._id ?? i)}
        loading={loading}
        error={loadError && <ErrorState title="Couldn't load audit logs" message={loadError} onRetry={() => setReloadKey((k) => k + 1)} className="border-0" />}
        globalFilter={search}
        initialSort={{ id: 'timestamp', direction: 'desc' }}
        pagination={{ pageSize: 25 }}
        mobileLayout="cards"
        toolbar={
          <Toolbar>
            <SearchInput value={search} onValueChange={setSearch} placeholder="Search actor, action, entity…" aria-label="Search audit logs" containerClassName="w-full sm:max-w-sm" />
          </Toolbar>
        }
        emptyState={<EmptyState size="compact" icon={<ScrollText />} title="No audit events yet" description="Actions like creating or suspending an organization are recorded here." />}
      />
    </PageSection>
  );
}
