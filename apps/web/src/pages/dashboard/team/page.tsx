import { useState, useEffect, useMemo } from 'react';
import type { FormEvent } from 'react';
import { UsersService, PerformanceService, BeatsService, HierarchyService } from '@bharatsales/api-client';
import { User, UserRole, HierarchyNode } from '@bharatsales/shared-types';
import {
  Alert,
  Avatar,
  Button,
  DataTable,
  EmptyState,
  Input,
  Modal,
  PageHeader,
  PageSection,
  SearchInput,
  Select,
  StatCard,
  StatGrid,
  StatusPill,
  Toolbar,
  formatINR,
  formatNumber,
  formatPercent,
  useToast,
} from '@bharatsales/ui';
import type { DataTableColumn } from '@bharatsales/ui';
import {
  AlertTriangle,
  Check,
  Copy,
  IndianRupee,
  MailCheck,
  MapPin,
  Route,
  Target,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import { useCurrentUser } from '../../../contexts/CurrentUserContext';
import { ErrorState, getErrorMessage } from '../../../components/common/ErrorState';

const ALL_STATUS = 'All Status';
const STATUS_OPTIONS = [
  { value: ALL_STATUS, label: 'All statuses' },
  { value: 'Active', label: 'Active' },
  { value: 'Invited', label: 'Invited' },
  { value: 'Inactive', label: 'Inactive' },
  { value: 'Suspended', label: 'Suspended' },
];

const ROLE_OPTIONS = [
  { value: 'Sales Representative', label: 'Sales Representative' },
  { value: 'Sales Manager', label: 'Sales Manager' },
];

const EMPTY_MEMBER = { name: '', role: 'Sales Representative' as UserRole, territoryId: '', mobile: '', email: '' };

type FieldErrors = Partial<Record<'name' | 'email' | 'territoryId', string>>;

export default function TeamPage() {
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(ALL_STATUS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMember, setNewMember] = useState(EMPTY_MEMBER);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [allMembers, setAllMembers] = useState<User[]>([]);
  const [hierarchyNodes, setHierarchyNodes] = useState<HierarchyNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState('');
  const [hierarchyError, setHierarchyError] = useState('');
  const [teamDSR, setTeamDSR] = useState<any>(null);
  const [teamTargets, setTeamTargets] = useState<any[]>([]);
  const [beatCompletion, setBeatCompletion] = useState<{ teamCompletionPercentage: number; reps: any[] } | null>(null);
  const { role } = useCurrentUser();
  const [inviteLink, setInviteLink] = useState('');
  const [inviteSentTo, setInviteSentTo] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [inviting, setInviting] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchTeamStats();
    fetchHierarchyNodes();
  }, []);

  const isOrgAdmin = role === 'Organization Admin';

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setLoadError('');
      const data = await UsersService.getUsers();
      setAllMembers(data || []);
    } catch (error) {
      console.error('Failed to fetch team members:', error);
      setLoadError(getErrorMessage(error) ?? "Couldn't load your team. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchHierarchyNodes = async () => {
    setHierarchyError('');
    try {
      const data = await HierarchyService.getHierarchyNodes();
      setHierarchyNodes(data || []);
    } catch (error) {
      console.error('Failed to fetch hierarchy nodes:', error);
      setHierarchyError(getErrorMessage(error) ?? "Couldn't load territories.");
    }
  };

  const fetchTeamStats = async () => {
    setStatsLoading(true);
    setStatsError('');
    const today = new Date().toISOString().split('T')[0];
    // allSettled: show the stats that loaded, and surface the first failure with a retry.
    const [dsr, targets, beats] = await Promise.allSettled([
      PerformanceService.getTeamDSR(today),
      PerformanceService.getTeamTargets(),
      BeatsService.getTeamBeatCompletion(),
    ]);
    setTeamDSR(dsr.status === 'fulfilled' ? dsr.value : null);
    setTeamTargets(targets.status === 'fulfilled' ? targets.value || [] : []);
    setBeatCompletion(beats.status === 'fulfilled' ? beats.value : null);
    const failed = [dsr, targets, beats].find((r): r is PromiseRejectedResult => r.status === 'rejected');
    if (failed) setStatsError(getErrorMessage(failed.reason) ?? "Couldn't load today's team stats.");
    setStatsLoading(false);
  };

  const repStats = (userId: string) => teamDSR?.repBreakdown?.find((r: any) => r.userId === userId);
  const repTarget = (userId: string) => teamTargets.find((t: any) => t.entityId === userId);

  const nodeNames = useMemo(() => {
    const map = new Map<string, string>();
    hierarchyNodes.forEach((n) => map.set(n.id, n.name));
    return map;
  }, [hierarchyNodes]);

  const territoryLabel = (member: User) =>
    member.territoryIds && member.territoryIds.length
      ? member.territoryIds.map((id) => nodeNames.get(id) ?? id).join(', ')
      : 'No territory';

  // Status filter runs here; text search runs inside the table (name, role, territory, email).
  const filteredMembers = allMembers.filter(
    (member) => statusFilter === ALL_STATUS || member.status === statusFilter,
  );

  const hasFilters = Boolean(searchTerm) || statusFilter !== ALL_STATUS;
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter(ALL_STATUS);
  };

  const openAddModal = () => {
    setInviteError('');
    setFieldErrors({});
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    if (inviting) return;
    setShowAddModal(false);
  };

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {};
    if (!newMember.name.trim()) errors.name = 'Enter the member’s full name';
    if (!newMember.email.trim()) errors.email = 'Enter an email address for the invite';
    else if (!/^\S+@\S+\.\S+$/.test(newMember.email.trim())) errors.email = 'Enter a valid email address';
    if (!newMember.territoryId) errors.territoryId = 'Select a territory';
    return errors;
  };

  const handleAddMember = async () => {
    if (!newMember.name || !newMember.email || !newMember.territoryId) return;

    setInviteError('');
    setInviting(true);
    try {
      const result = await UsersService.inviteUser({
        name: newMember.name,
        email: newMember.email,
        role: newMember.role,
        territoryIds: [newMember.territoryId],
      });
      // The API only returns the token in test runs; normally the invite goes
      // out by email and there is no link to show.
      setInviteLink(result.inviteToken ? `${window.location.origin}/invite?token=${result.inviteToken}` : '');
      setInviteSentTo(newMember.email);
      setShowAddModal(false);
      setNewMember(EMPTY_MEMBER);
      toast.success(`Invitation sent to ${newMember.email}`);
      fetchUsers(); // Refresh list
    } catch (err: any) {
      setInviteError(err?.response?.data?.message || err.message || 'Failed to send invitation.');
    } finally {
      setInviting(false);
    }
  };

  const onSubmitInvite = (e: FormEvent) => {
    e.preventDefault();
    const errors = validate();
    setFieldErrors(errors);
    const firstInvalid = (['name', 'territoryId', 'email'] as const).find((k) => errors[k]);
    if (firstInvalid) {
      document.getElementById(`invite-${firstInvalid}`)?.focus();
      return;
    }
    handleAddMember();
  };

  const updateField = <K extends keyof typeof newMember>(key: K, value: (typeof newMember)[K]) => {
    setNewMember((m) => ({ ...m, [key]: value }));
    if (key in fieldErrors) setFieldErrors((errs) => ({ ...errs, [key]: undefined }));
  };

  const closeInviteSent = () => {
    setInviteLink('');
    setInviteSentTo('');
    setLinkCopied(false);
  };

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setLinkCopied(true);
      toast.success('Invite link copied');
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy the link. Select it and copy manually.");
    }
  };

  const activeCount = allMembers.filter((m) => m.status === 'Active').length;
  const invitedCount = allMembers.filter((m) => m.status === 'Invited').length;
  const orgAchievement = (() => {
    const totalTarget = teamTargets.reduce((sum, t) => sum + (t.targetValue || 0), 0);
    const totalActual = teamTargets.reduce((sum, t) => sum + (t.actualValue || 0), 0);
    return totalTarget > 0 ? Math.round((totalActual / totalTarget) * 100) : 0;
  })();
  const repsBelowHalf = (beatCompletion?.reps || []).filter((r: any) => r.completionPercentage < 50).length;

  const columns: DataTableColumn<User>[] = [
    {
      id: 'name',
      header: 'Member',
      accessor: (m) => `${m.name} ${m.role} ${territoryLabel(m)} ${m.email ?? ''}`,
      sortable: true,
      sortFn: (a, b) => a.name.localeCompare(b.name),
      primary: true,
      cell: (m) => (
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={m.name} size="md" />
          <div className="min-w-0">
            <div className="truncate font-medium text-gray-900">{m.name}</div>
            <div className="truncate text-xs text-foreground-subtle">{m.role}</div>
            {m.mobile && <div className="truncate text-xs text-foreground-subtle tabular-nums">{m.mobile}</div>}
          </div>
        </div>
      ),
    },
    {
      id: 'territory',
      header: 'Territory',
      accessor: (m) => territoryLabel(m),
      sortable: true,
      hideBelow: 'lg',
      cell: (m) => (
        <span className={m.territoryIds?.length ? 'text-gray-700' : 'text-foreground-subtle'}>{territoryLabel(m)}</span>
      ),
    },
    {
      id: 'visits',
      header: 'Visits today',
      accessor: (m) => repStats(m.id)?.totalVisits ?? -1,
      sortable: true,
      align: 'right',
      hideBelow: 'md',
      cell: (m) => <span className="tabular-nums">{formatNumber(repStats(m.id)?.totalVisits)}</span>,
    },
    {
      id: 'orders',
      header: 'Orders today',
      accessor: (m) => repStats(m.id)?.totalOrderValue ?? -1,
      sortable: true,
      align: 'right',
      cell: (m) => {
        const stats = repStats(m.id);
        return <span className="tabular-nums">{stats ? formatINR(stats.totalOrderValue, { compact: true }) : '—'}</span>;
      },
    },
    {
      id: 'target',
      header: 'Target',
      accessor: (m) => repTarget(m.id)?.meta?.achievementPercentage ?? -1,
      sortable: true,
      align: 'right',
      hideBelow: 'md',
      cell: (m) => {
        const target = repTarget(m.id);
        return (
          <span className="tabular-nums font-medium text-gray-900">
            {target ? `${Math.round(target.meta?.achievementPercentage ?? 0)}%` : '—'}
          </span>
        );
      },
    },
    {
      id: 'status',
      header: 'Status',
      accessor: 'status',
      sortable: true,
      cell: (m) => <StatusPill status={m.status} />,
    },
  ];

  const territoryOptions = hierarchyNodes.map((node) => ({ value: node.id, label: `${node.level}: ${node.name}` }));

  return (
    <PageSection>
      <PageHeader
        title={isOrgAdmin ? 'Organization team' : 'My team'}
        description={
          <>
            {isOrgAdmin ? 'Every employee across your organization' : 'Your direct reporting team'}
            {!loading && !loadError && <> · {formatNumber(allMembers.length)} members</>}
          </>
        }
        actions={
          <Button variant="accent" leftIcon={<UserPlus />} onClick={openAddModal}>
            Invite member
          </Button>
        }
      />

      <StatGrid columns={3}>
        <StatCard label="Total members" value={formatNumber(allMembers.length)} icon={<Users />} loading={loading} hint={invitedCount ? `${invitedCount} invite${invitedCount === 1 ? '' : 's'} pending` : undefined} />
        <StatCard label="Active" value={formatNumber(activeCount)} icon={<UserCheck />} tone="success" loading={loading} />
        <StatCard label="Visits (today)" value={formatNumber(teamDSR?.metrics?.totalVisits ?? 0)} icon={<MapPin />} tone="info" loading={statsLoading} />
        <StatCard
          label="Team revenue (today)"
          value={formatINR(teamDSR?.metrics?.totalOrderValue ?? 0, { compact: true })}
          icon={<IndianRupee />}
          tone="accent"
          loading={statsLoading}
        />
        <StatCard
          label="Beat completion (today)"
          value={formatPercent(beatCompletion?.teamCompletionPercentage ?? 0, { decimals: 0 })}
          icon={<Route />}
          loading={statsLoading}
        />
        {isOrgAdmin ? (
          <StatCard label="Org-wide target achievement" value={`${orgAchievement}%`} icon={<Target />} tone="primary" loading={statsLoading} />
        ) : (
          <StatCard
            label="Reps below 50% beat completion"
            value={formatNumber(repsBelowHalf)}
            icon={<AlertTriangle />}
            tone={repsBelowHalf > 0 ? 'danger' : 'neutral'}
            loading={statsLoading}
          />
        )}
      </StatGrid>

      {statsError && !statsLoading && (
        <ErrorState title="Couldn't load today's team stats" message={statsError} onRetry={fetchTeamStats} />
      )}

      <DataTable
        caption="Team members"
        itemLabel="members"
        data={filteredMembers}
        columns={columns}
        getRowId={(m) => m.id}
        loading={loading}
        error={
          loadError && (
            <ErrorState title="Couldn't load team members" message={loadError} onRetry={fetchUsers} className="border-0" />
          )
        }
        globalFilter={searchTerm}
        initialSort={{ id: 'name', direction: 'asc' }}
        mobileLayout="cards"
        toolbar={
          <Toolbar>
            <SearchInput
              value={searchTerm}
              onValueChange={setSearchTerm}
              placeholder="Search name, role, territory…"
              aria-label="Search team members"
              containerClassName="w-full sm:max-w-xs"
            />
            <div className="flex items-center gap-2">
              <Select
                hideLabel
                label="Status"
                options={STATUS_OPTIONS}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                containerClassName="w-full sm:w-44"
              />
              {hasFilters && (
                <Button variant="ghost" onClick={clearFilters}>
                  Clear
                </Button>
              )}
            </div>
          </Toolbar>
        }
        emptyState={
          hasFilters ? (
            <EmptyState
              size="compact"
              icon={<Users />}
              title="No members match these filters"
              description="Try a different name or status."
              action={<Button variant="outline" onClick={clearFilters}>Clear filters</Button>}
            />
          ) : (
            <EmptyState
              size="compact"
              icon={<Users />}
              title="No team members yet"
              description="Invite your sales reps and managers so they can start logging visits and orders."
              action={<Button leftIcon={<UserPlus />} onClick={openAddModal}>Invite member</Button>}
            />
          )
        }
      />

      {/* Invite member */}
      <Modal
        open={showAddModal}
        onClose={closeAddModal}
        dismissible={!inviting}
        title="Invite team member"
        description="They'll get an email with a link to set their password."
        footer={
          <>
            <Button variant="outline" onClick={closeAddModal} disabled={inviting}>
              Cancel
            </Button>
            <Button type="submit" form="invite-member-form" loading={inviting} leftIcon={<MailCheck />}>
              {inviting ? 'Sending invite…' : 'Send invitation'}
            </Button>
          </>
        }
      >
        <form id="invite-member-form" onSubmit={onSubmitInvite} noValidate className="space-y-3">
          {hierarchyError && (
            <Alert tone="danger" title="Territories didn't load">
              {hierarchyError}{' '}
              <button type="button" className="font-medium underline" onClick={fetchHierarchyNodes}>
                Try again
              </button>
            </Alert>
          )}
          {inviteError && (
            <Alert tone="danger" title="Couldn't send the invitation" onDismiss={() => setInviteError('')}>
              {inviteError}
            </Alert>
          )}
          <Input
            id="invite-name"
            data-autofocus
            label="Full name"
            required
            autoComplete="name"
            placeholder="e.g. Rahul Sharma"
            value={newMember.name}
            onChange={(e) => updateField('name', e.target.value)}
            error={fieldErrors.name}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              id="invite-role"
              label="Role"
              required
              options={ROLE_OPTIONS}
              value={newMember.role}
              onChange={(e) => updateField('role', e.target.value as UserRole)}
            />
            <Select
              id="invite-territoryId"
              label="Territory"
              required
              placeholder="Select territory"
              options={territoryOptions}
              value={newMember.territoryId}
              onChange={(e) => updateField('territoryId', e.target.value)}
              error={fieldErrors.territoryId}
              helperText={hierarchyNodes.length === 0 ? 'No territories yet — create one on the Hierarchy page first.' : undefined}
            />
          </div>
          <Input
            id="invite-email"
            type="email"
            label="Email"
            required
            autoComplete="email"
            placeholder="name@company.com"
            value={newMember.email}
            onChange={(e) => updateField('email', e.target.value)}
            error={fieldErrors.email}
          />
          <Input
            id="invite-mobile"
            type="tel"
            label="Mobile number"
            optional
            autoComplete="tel"
            placeholder="+91 98765 43210"
            value={newMember.mobile}
            onChange={(e) => updateField('mobile', e.target.value)}
          />
        </form>
      </Modal>

      {/* Invite sent */}
      <Modal
        open={Boolean(inviteSentTo)}
        onClose={closeInviteSent}
        size="sm"
        title="Invitation sent"
        footer={<Button onClick={closeInviteSent}>Done</Button>}
      >
        <div className="space-y-4">
          <p className="text-sm text-foreground-muted">
            We emailed <span className="font-medium text-gray-900">{inviteSentTo}</span> a link to set their password and
            activate their account. The link expires in 72 hours.
          </p>
          {inviteLink && (
            <div className="flex items-end gap-2">
              <Input
                readOnly
                label="Invite link"
                value={inviteLink}
                onFocus={(e) => e.target.select()}
                containerClassName="min-w-0 flex-1"
                className="text-xs"
              />
              <Button
                variant="outline"
                onClick={copyInviteLink}
                leftIcon={linkCopied ? <Check /> : <Copy />}
                className="shrink-0"
              >
                {linkCopied ? 'Copied' : 'Copy'}
              </Button>
            </div>
          )}
        </div>
      </Modal>
    </PageSection>
  );
}
