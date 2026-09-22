import { useState, useEffect } from 'react';
import { ApprovalsService, AttendanceService } from '@bharatsales/api-client';
import { Approval, ApprovalRule, AttendanceSession } from '@bharatsales/shared-types';
import {
  Badge,
  type BadgeTone,
  Button,
  Card,
  CardBody,
  CardHeader,
  ConfirmDialog,
  DataTable,
  type DataTableColumn,
  EmptyState,
  PageHeader,
  PageSection,
  SearchInput,
  Select,
  Skeleton,
  LoadingRegion,
  StatCard,
  StatGrid,
  Toolbar,
  formatDate,
  formatDateTime,
  formatINR,
  formatNumber,
  useToast,
} from '@bharatsales/ui';
import { Check, CheckCircle2, Clock, IndianRupee, ShieldCheck, X, XCircle } from 'lucide-react';
import { ErrorState } from '../../../components/common/ErrorState';

type Regularization = AttendanceSession & { id?: string; _id?: string; regularizationReason?: string; user?: { name?: string; email?: string } };

const TYPE_OPTIONS = ['All Types', 'Credit Limit', 'Discount', 'Overdue', 'Price'].map((t) => ({
  value: t,
  label: t === 'All Types' ? 'All types' : t,
}));

const PRIORITY_TONE: Record<string, BadgeTone> = { High: 'danger', Medium: 'warning', Low: 'neutral' };

/** API dates may be ISO strings or already-formatted text; only reformat real dates. */
const displayDate = (value: string) => (value && !Number.isNaN(new Date(value).getTime()) ? formatDate(value) : value || '—');

export default function ApprovalsPage() {
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All Types');

  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [approvalRules, setApprovalRules] = useState<ApprovalRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Approval | null>(null);

  // Attendance regularization requests (Sales Manager / Organization Admin approve these).
  const [regularizations, setRegularizations] = useState<Regularization[]>([]);
  const [regLoading, setRegLoading] = useState(true);
  const [regProcessingId, setRegProcessingId] = useState<string | null>(null);
  const [regRejectId, setRegRejectId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
    fetchRegularizations();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setFetchError('');
      const [approvalsData, rulesData] = await Promise.all([ApprovalsService.getApprovals(), ApprovalsService.getApprovalRules()]);
      setApprovals(approvalsData || []);
      setApprovalRules(rulesData || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setFetchError('Failed to load approvals. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRegularizations = async () => {
    try {
      setRegLoading(true);
      const data = await AttendanceService.getPendingRegularizations();
      setRegularizations((data as Regularization[]) || []);
    } catch (error) {
      console.error('Failed to fetch regularization requests:', error);
    } finally {
      setRegLoading(false);
    }
  };

  const handleRegularizationDecision = async (sessionId: string, status: 'APPROVED' | 'REJECTED') => {
    setRegProcessingId(sessionId);
    try {
      await AttendanceService.approveRegularization(sessionId, status);
      setRegularizations(regularizations.filter((r) => (r.id || r._id) !== sessionId));
      toast.success(`Attendance regularization ${status === 'APPROVED' ? 'approved' : 'rejected'}.`);
    } catch (error) {
      console.error('Failed to process regularization:', error);
      toast.error('Failed to process regularization request.');
    } finally {
      setRegProcessingId(null);
    }
  };

  // Filter approvals
  const filteredApprovals = approvals.filter((approval) => {
    const matchesSearch =
      approval.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      approval.outlet.toLowerCase().includes(searchTerm.toLowerCase()) ||
      approval.order.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'All Types' || approval.type.includes(typeFilter);
    return matchesSearch && matchesType;
  });

  const pendingApprovals = filteredApprovals.filter((a) => a.status === 'Pending');
  const totalPendingValue = pendingApprovals.reduce((sum, a) => sum + a.amount, 0);

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    try {
      await ApprovalsService.updateApproval(id, { status: 'Approved' });
      setApprovals(approvals.map((a) => (a.id === id ? { ...a, status: 'Approved' } : a)));
      toast.success(`Approval ${id} has been approved.`);
    } catch (error) {
      console.error('Failed to approve:', error);
      toast.error('Failed to approve. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setProcessingId(id);
    try {
      await ApprovalsService.updateApproval(id, { status: 'Rejected' });
      setApprovals(approvals.map((a) => (a.id === id ? { ...a, status: 'Rejected' } : a)));
      toast.success(`Approval ${id} has been rejected.`);
    } catch (error) {
      console.error('Failed to reject:', error);
      toast.error('Failed to reject. Please try again.');
    } finally {
      setProcessingId(null);
      setRejectTarget(null);
    }
  };

  const columns: DataTableColumn<Approval>[] = [
    {
      id: 'request',
      header: 'Request',
      accessor: 'id',
      primary: true,
      cell: (a) => (
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-medium text-gray-900">{a.id}</span>
            <Badge size="sm" tone={PRIORITY_TONE[a.priority] ?? 'neutral'}>
              {a.priority}
            </Badge>
          </div>
          <p className="mt-0.5 text-xs text-foreground-subtle">{a.type}</p>
        </div>
      ),
    },
    {
      id: 'outlet',
      header: 'Outlet / order',
      accessor: 'outlet',
      cell: (a) => (
        <div className="min-w-0">
          <p className="font-medium text-gray-900">{a.outlet}</p>
          <p className="text-xs text-foreground-subtle">{a.order}</p>
        </div>
      ),
    },
    {
      id: 'reason',
      header: 'Reason',
      accessor: 'reason',
      hideBelow: 'lg',
      cell: (a) => <span className="line-clamp-2 text-foreground-muted">{a.reason || '—'}</span>,
    },
    {
      id: 'requested',
      header: 'Requested by',
      accessor: 'requestedBy',
      hideBelow: 'md',
      cell: (a) => (
        <div>
          <p className="text-gray-700">{a.requestedBy}</p>
          <p className="text-xs text-foreground-subtle">{displayDate(a.date)}</p>
        </div>
      ),
    },
    {
      id: 'amount',
      header: 'Amount',
      accessor: 'amount',
      align: 'right',
      sortable: true,
      cell: (a) => <span className="font-semibold tabular-nums text-gray-900">{formatINR(a.amount)}</span>,
    },
    {
      id: 'actions',
      header: <span className="sr-only">Actions</span>,
      align: 'right',
      cell: (a) => (
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            leftIcon={<X />}
            disabled={processingId === a.id}
            onClick={() => setRejectTarget(a)}
            aria-label={`Reject approval ${a.id}`}
          >
            Reject
          </Button>
          <Button
            size="sm"
            leftIcon={<Check />}
            loading={processingId === a.id && !rejectTarget}
            disabled={processingId === a.id}
            onClick={() => handleApprove(a.id)}
            aria-label={`Approve approval ${a.id}`}
          >
            Approve
          </Button>
        </div>
      ),
    },
  ];

  const initialLoad = loading && approvals.length === 0;

  return (
    <PageSection>
      <PageHeader
        title="Approval centre"
        description={`Review and approve pending requests · ${formatNumber(pendingApprovals.length)} pending`}
      />

      <StatGrid columns={4}>
        <StatCard label="Pending" value={formatNumber(pendingApprovals.length)} icon={<Clock />} tone="warning" loading={initialLoad} />
        <StatCard
          label="Approved"
          value={formatNumber(approvals.filter((a) => a.status === 'Approved').length)}
          icon={<CheckCircle2 />}
          tone="success"
          loading={initialLoad}
        />
        <StatCard
          label="Rejected"
          value={formatNumber(approvals.filter((a) => a.status === 'Rejected').length)}
          icon={<XCircle />}
          tone="danger"
          loading={initialLoad}
        />
        <StatCard
          label="Total pending value"
          value={formatINR(totalPendingValue, { compact: true })}
          icon={<IndianRupee />}
          loading={initialLoad}
        />
      </StatGrid>

      <DataTable
        caption="Pending approvals"
        itemLabel="approvals"
        data={pendingApprovals}
        columns={columns}
        getRowId={(a) => a.id}
        loading={initialLoad}
        error={fetchError ? <ErrorState title="Couldn't load approvals" message={fetchError} onRetry={fetchData} className="border-0" /> : undefined}
        initialSort={{ id: 'amount', direction: 'desc' }}
        mobileLayout="cards"
        toolbar={
          <Toolbar>
            <SearchInput
              value={searchTerm}
              onValueChange={setSearchTerm}
              placeholder="Search by ID, outlet or order"
              aria-label="Search approvals"
              containerClassName="w-full sm:max-w-sm"
            />
            <Select
              hideLabel
              label="Approval type"
              options={TYPE_OPTIONS}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              containerClassName="w-full sm:w-44"
            />
          </Toolbar>
        }
        emptyState={
          <EmptyState
            icon={<CheckCircle2 />}
            title={searchTerm || typeFilter !== 'All Types' ? 'No pending approvals match' : "You're all caught up"}
            description={
              searchTerm || typeFilter !== 'All Types'
                ? 'Try a different search or approval type.'
                : 'All approvals have been processed. New requests will appear here.'
            }
            action={
              searchTerm || typeFilter !== 'All Types' ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setTypeFilter('All Types');
                  }}
                >
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        }
      />

      {/* Attendance Regularization Requests */}
      <Card>
        <CardHeader
          title="Attendance regularization requests"
          description="Reps asking to correct a missed or late check-in."
          divided
        />
        {regLoading ? (
          <LoadingRegion label="Loading regularization requests" className="space-y-4 p-4">
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
          </LoadingRegion>
        ) : regularizations.length > 0 ? (
          <ul className="divide-y divide-border">
            {regularizations.map((r) => {
              const sessionId = (r.id || r._id) as string;
              const busy = regProcessingId === sessionId;
              return (
                <li key={sessionId} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 text-sm font-medium text-gray-900">
                      <Clock className="h-4 w-4 shrink-0 text-warning-600" aria-hidden="true" />
                      {r.user?.name || r.user?.email || 'Sales Representative'}
                    </p>
                    <p className="mt-1 text-sm text-foreground-muted">
                      Shift started {r.startTime ? formatDateTime(r.startTime) : '—'}
                    </p>
                    <p className="mt-1 text-sm text-foreground-muted">
                      <span className="text-foreground-subtle">Reason:</span>{' '}
                      {r.regularizationReason || 'No reason provided'}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button size="sm" variant="outline" leftIcon={<X />} disabled={busy} onClick={() => setRegRejectId(sessionId)}>
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      leftIcon={<Check />}
                      loading={busy && regRejectId !== sessionId}
                      disabled={busy}
                      onClick={() => handleRegularizationDecision(sessionId, 'APPROVED')}
                    >
                      Approve
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState size="compact" icon={<CheckCircle2 />} title="No pending regularization requests" />
        )}
      </Card>

      {/* Approval Rules */}
      <Card>
        <CardHeader title="Approval rules" description="Which requests need approval, and who approves them." divided />
        <CardBody>
          {initialLoad ? (
            <LoadingRegion label="Loading approval rules" className="space-y-3">
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
            </LoadingRegion>
          ) : approvalRules.length === 0 ? (
            <EmptyState size="compact" icon={<ShieldCheck />} title="No approval rules configured" />
          ) : (
            <ul className="space-y-2">
              {approvalRules.map((rule) => (
                <li key={rule.trigger} className="flex items-center justify-between gap-4 rounded-lg bg-surface-muted p-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">{rule.trigger}</p>
                    <p className="text-xs text-foreground-subtle">Approver: {rule.approver}</p>
                  </div>
                  <Badge tone={rule.enabled ? 'success' : 'neutral'} dot>
                    {rule.enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <ConfirmDialog
        open={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        tone="danger"
        title="Reject this request?"
        description={
          rejectTarget ? (
            <>
              {rejectTarget.type} for <strong className="text-gray-900">{rejectTarget.outlet}</strong> ({formatINR(rejectTarget.amount)}) will be
              rejected.
            </>
          ) : undefined
        }
        confirmLabel="Reject request"
        onConfirm={() => handleReject(rejectTarget!.id)}
      />

      <ConfirmDialog
        open={!!regRejectId}
        onClose={() => setRegRejectId(null)}
        tone="danger"
        title="Reject this regularization?"
        description="The rep's attendance for this shift won't be corrected."
        confirmLabel="Reject request"
        onConfirm={async () => {
          await handleRegularizationDecision(regRejectId!, 'REJECTED');
          setRegRejectId(null);
        }}
      />
    </PageSection>
  );
}
