import { useState, useEffect } from 'react';
import {
  Alert,
  Button,
  Card,
  DataTable,
  DataTableColumn,
  EmptyState,
  Input,
  Modal,
  PageHeader,
  PageSection,
  SearchInput,
  Select,
  Skeleton,
  StatusPill,
  Toolbar,
  ProgressBar,
  toneForPercent,
  formatDate,
  formatINR,
  formatNumber,
  formatPercent,
  useToast,
} from '@bharatsales/ui';
import { TargetsService, UsersService } from '@bharatsales/api-client';
import { SalesTarget, User } from '@bharatsales/shared-types';
import { Plus, Target } from 'lucide-react';
import { useCurrentUser } from '../../../contexts/CurrentUserContext';
import { ErrorState, getErrorMessage } from '../../../components/common/ErrorState';

const METRIC_OPTIONS: { label: string; value: 'SalesValue' | 'VisitCount' | 'ProductiveCalls' | 'CollectionValue' }[] = [
  { label: 'Revenue', value: 'SalesValue' },
  { label: 'Visits', value: 'VisitCount' },
  { label: 'Productive Calls', value: 'ProductiveCalls' },
  { label: 'Collections', value: 'CollectionValue' },
];

type PeriodOption = 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Annual';

function defaultDateRangeFor(period: PeriodOption): { startDate: string; endDate: string } {
  const now = new Date();
  const toISODate = (d: Date) => d.toISOString().slice(0, 10);
  if (period === 'Daily') {
    return { startDate: toISODate(now), endDate: toISODate(now) };
  }
  if (period === 'Weekly') {
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { startDate: toISODate(start), endDate: toISODate(end) };
  }
  if (period === 'Quarterly') {
    const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
    const start = new Date(now.getFullYear(), quarterStartMonth, 1);
    const end = new Date(now.getFullYear(), quarterStartMonth + 3, 0);
    return { startDate: toISODate(start), endDate: toISODate(end) };
  }
  if (period === 'Annual') {
    return { startDate: toISODate(new Date(now.getFullYear(), 0, 1)), endDate: toISODate(new Date(now.getFullYear(), 11, 31)) };
  }
  // Monthly (default)
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { startDate: toISODate(start), endDate: toISODate(end) };
}

/** Money metrics show ₹; count metrics (visits, calls) show plain numbers. */
const isMoneyMetric = (m?: string) => !m || m === 'SalesValue' || m === 'CollectionValue';
const formatMetric = (value: number | undefined, metric?: string, compact = true) =>
  isMoneyMetric(metric) ? formatINR(value ?? 0, { compact }) : formatNumber(value ?? 0);

function Progress({ percent, label, size = 'sm', className }: { percent: number; label: string; size?: 'sm' | 'md'; className?: string }) {
  const p = percent || 0;
  return <ProgressBar value={p} label={label} size={size} tone={toneForPercent(p)} className={className} />;
}

/** "YYYY-MM" keys for this month and the two before it, plus "all". */
const ALL_PERIODS = 'all';
function monthOptions(now = new Date()) {
  return [0, 1, 2].map((back) => {
    const d = new Date(now.getFullYear(), now.getMonth() - back, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return { value, label: d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) };
  });
}
const MONTH_OPTIONS = monthOptions();
const PERIOD_OPTIONS = [...MONTH_OPTIONS, { value: ALL_PERIODS, label: 'All targets' }];

/** Does the target's date range overlap the selected month? */
function overlapsMonth(t: SalesTarget, month: string): boolean {
  if (month === ALL_PERIODS) return true;
  const [y, m] = month.split('-').map(Number);
  const monthStart = new Date(y, m - 1, 1).getTime();
  const monthEnd = new Date(y, m, 0, 23, 59, 59).getTime();
  const start = t.startDate ? new Date(t.startDate).getTime() : -Infinity;
  const end = t.endDate ? new Date(t.endDate).getTime() : Infinity;
  return start <= monthEnd && end >= monthStart;
}

/** Older seed records use userId/targetAmount instead of entityId/targetValue. */
function normalizeTarget(raw: SalesTarget): SalesTarget {
  const t = raw as SalesTarget & { userId?: string; targetAmount?: number };
  return {
    ...t,
    entityType: t.entityType ?? (t.userId ? 'User' : t.entityType),
    entityId: t.entityId ?? t.userId ?? '',
    targetValue: t.targetValue ?? t.targetAmount ?? 0,
    actualValue: t.actualValue ?? 0,
  };
}

export default function TargetsPage() {
  const toast = useToast();
  const [period, setPeriod] = useState(MONTH_OPTIONS[0].value);
  const [showSetTargetModal, setShowSetTargetModal] = useState(false);
  const [actionError, setActionError] = useState('');
  const [newTarget, setNewTarget] = useState<{ metric: 'SalesValue' | 'VisitCount' | 'ProductiveCalls' | 'CollectionValue' | ''; user: string; target: string; period: PeriodOption }>({ metric: '', user: '', target: '', period: 'Monthly' });
  const [fieldErrors, setFieldErrors] = useState<{ metric?: string; user?: string; target?: string }>({});
  const [orgUsers, setOrgUsers] = useState<User[]>([]);
  const { role } = useCurrentUser();
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');

  const [allTargets, setAllTargets] = useState<SalesTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    fetchTargets();
  }, []);

  const targets = allTargets.filter((t) => overlapsMonth(t, period));
  const periodLabel = PERIOD_OPTIONS.find((o) => o.value === period)?.label ?? '';

  const [usersError, setUsersError] = useState('');
  const fetchUsers = () => {
    setUsersError('');
    UsersService.getUsers()
      .then(setOrgUsers)
      .catch((err) => {
        setOrgUsers([]);
        setUsersError(getErrorMessage(err) ?? "Couldn't load your team list.");
      });
  };
  useEffect(fetchUsers, []);

  const fetchTargets = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const data = await TargetsService.getTargets();
      setAllTargets((data || []).map(normalizeTarget));
    } catch (error) {
      console.error('Failed to fetch targets:', error);
      setLoadError(getErrorMessage(error) ?? 'Failed to load targets.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetTarget = async () => {
    const errs: typeof fieldErrors = {};
    if (!newTarget.metric) errs.metric = 'Choose a metric';
    if (!newTarget.user) errs.user = 'Choose who this target is for';
    if (!newTarget.target) errs.target = 'Enter a target value';
    else if (Number(newTarget.target) <= 0) errs.target = 'Target must be more than 0';
    setFieldErrors(errs);
    const first = Object.keys(errs)[0];
    if (first) { document.getElementById(`target-${first}`)?.focus(); return; }
    if (!newTarget.metric || !newTarget.user || !newTarget.target) return;
    setSubmitting(true);
    setActionError('');
    try {
      const { startDate, endDate } = defaultDateRangeFor(newTarget.period);
      await TargetsService.createTarget({
        entityType: 'User',
        entityId: newTarget.user,
        period: newTarget.period,
        targetMetric: newTarget.metric,
        startDate,
        endDate,
        targetValue: Number(newTarget.target),
        actualValue: 0,
        status: 'On Track',
      });
      const metricLabel = METRIC_OPTIONS.find(m => m.value === newTarget.metric)?.label || newTarget.metric;
      toast.success(`${newTarget.period} ${metricLabel.toLowerCase()} target set`);
      setShowSetTargetModal(false);
      setNewTarget({ metric: '', user: '', target: '', period: 'Monthly' });
      fetchTargets();
    } catch (err: any) {
      console.error('Failed to create target', err);
      setActionError(err?.response?.data?.message || 'Failed to create target.');
    } finally {
      setSubmitting(false);
    }
  };

  const openSetTarget = () => {
    setFieldErrors({});
    setActionError('');
    setShowSetTargetModal(true);
  };

  // The API resolves entityName (rep / outlet / territory); the user lookup and
  // raw id are fallbacks for entities that were deleted or never resolved.
  const entityNameOf = (t: SalesTarget) =>
    (t as SalesTarget & { entityName?: string }).entityName ||
    (t.entityType === 'User' ? orgUsers.find(u => u.id === t.entityId)?.name : undefined) ||
    t.entityId;

  // Overall progress
  const totalActual = targets.reduce((sum, t) => sum + (t.actualValue || 0), 0);
  const totalTarget = targets.reduce((sum, t) => sum + (t.targetValue || 0), 0);
  const overallPercent = totalTarget > 0 ? Math.min(100, (totalActual / totalTarget) * 100) : 0;
  const remainingTarget = Math.max(0, totalTarget - totalActual);
  const now = Date.now();
  const upcomingEndDates = targets
    .map(t => new Date(t.endDate).getTime())
    .filter(d => !isNaN(d) && d > now);
  const nextEndDate = upcomingEndDates.length > 0 ? Math.min(...upcomingEndDates) : null;
  const daysRemaining = nextEndDate ? Math.max(0, Math.ceil((nextEndDate - now) / (1000 * 60 * 60 * 24))) : 0;
  const requiredPerDay = daysRemaining > 0 ? remainingTarget / daysRemaining : 0;

  const pct = (t: SalesTarget) => (t.targetValue ? (t.actualValue / t.targetValue) * 100 : 0);

  const columns: DataTableColumn<SalesTarget>[] = [
    {
      id: 'entity', header: 'Assigned to', accessor: (t) => `${entityNameOf(t)} ${t.entityType}`, sortable: true, primary: true,
      sortFn: (a, b) => entityNameOf(a).localeCompare(entityNameOf(b), 'en-IN'),
      cell: (t) => (
        <div className="min-w-0">
          <div className="truncate font-medium text-gray-900">{entityNameOf(t)}</div>
          <div className="text-xs text-foreground-subtle">
            {t.entityType} · {METRIC_OPTIONS.find(m => m.value === t.targetMetric)?.label ?? 'Revenue'} · {t.period}
          </div>
        </div>
      ),
    },
    {
      id: 'progress', header: 'Progress', accessor: pct, sortable: true, searchable: false,
      cell: (t) => (
        <div className="flex min-w-[9rem] items-center gap-3">
          <Progress percent={pct(t)} label={`Target progress for ${entityNameOf(t)}`} className="flex-1" />
          <span className="w-12 text-right text-sm font-medium tabular-nums text-gray-900">{formatPercent(pct(t), { decimals: 0 })}</span>
        </div>
      ),
    },
    { id: 'target', header: 'Target', accessor: 'targetValue', sortable: true, align: 'right', searchable: false, hideBelow: 'md',
      cell: (t) => <span className="tabular-nums">{formatMetric(t.targetValue, t.targetMetric)}</span> },
    { id: 'achieved', header: 'Achieved', accessor: 'actualValue', sortable: true, align: 'right', searchable: false,
      cell: (t) => <span className="font-medium tabular-nums text-gray-900">{formatMetric(t.actualValue, t.targetMetric)}</span> },
    { id: 'remaining', header: 'Remaining', accessor: (t) => Math.max(0, t.targetValue - t.actualValue), sortable: true, align: 'right', searchable: false, hideBelow: 'lg',
      cell: (t) => <span className="tabular-nums text-foreground-muted">{formatMetric(Math.max(0, t.targetValue - t.actualValue), t.targetMetric)}</span> },
    { id: 'ends', header: 'Ends', accessor: 'endDate', sortable: true, searchable: false, hideBelow: 'lg', cell: (t) => formatDate(t.endDate) },
    { id: 'status', header: 'Status', accessor: 'status', sortable: true, cell: (t) => <StatusPill status={t.status} /> },
  ];

  return (
    <PageSection>
      <PageHeader
        title="Targets & performance"
        description={period === ALL_PERIODS ? 'All targets — progress to date' : `${periodLabel} — progress to date`}
        actions={
          <>
            <Select hideLabel label="Period" value={period} onChange={(e) => setPeriod(e.target.value)}
              containerClassName="sm:w-44" options={PERIOD_OPTIONS} />
            <Button variant="accent" leftIcon={<Plus />} onClick={openSetTarget}>Set target</Button>
          </>
        }
      />

      {/* Overall progress */}
      <Card padding="lg">
        {loading ? (
          <div className="space-y-4" aria-hidden="true">
            <div className="flex justify-between"><Skeleton className="h-10 w-40" /><Skeleton className="h-10 w-28" /></div>
            <Skeleton className="h-2.5 w-full" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div>
                <div className="text-sm text-foreground-subtle">Overall achievement</div>
                <div className="mt-0.5 font-display text-xl font-bold tabular-nums text-gray-900 sm:text-2xl">{formatPercent(overallPercent, { decimals: 0 })}</div>
                <div className="mt-1 text-sm tabular-nums text-foreground-muted">{formatINR(totalActual, { compact: true })} of {formatINR(totalTarget, { compact: true })}</div>
              </div>
              <div className="text-right sm:text-left">
                <div className="text-sm text-foreground-subtle">Days remaining</div>
                <div className="mt-0.5 font-display text-xl font-bold tabular-nums text-gray-900 sm:text-2xl">{formatNumber(daysRemaining)}</div>
                <div className="mt-1 text-sm text-foreground-muted">until the next target ends</div>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <div className="text-sm text-foreground-subtle">Required run-rate</div>
                <div className="mt-0.5 font-display text-xl font-bold tabular-nums text-gray-900 sm:text-2xl">{formatINR(requiredPerDay, { compact: true })}</div>
                <div className="mt-1 text-sm text-foreground-muted">per day to close the gap</div>
              </div>
            </div>
            <Progress percent={overallPercent} label="Overall target achievement" size="md" className="mt-5" />
          </>
        )}
      </Card>

      <DataTable
        caption="Targets"
        itemLabel="targets"
        data={targets}
        columns={columns}
        loading={loading}
        error={loadError && <ErrorState title="Couldn't load targets" message={loadError} onRetry={fetchTargets} className="border-0" />}
        globalFilter={search}
        initialSort={{ id: 'progress', direction: 'asc' }}
        mobileLayout="cards"
        emptyState={
          search ? undefined : (
            <EmptyState icon={<Target />} title={period === ALL_PERIODS ? 'No targets set' : `No targets for ${periodLabel}`} description="Set revenue, visit or collection targets for your reps to track progress here."
              action={<Button leftIcon={<Plus />} onClick={openSetTarget}>Set target</Button>} />
          )
        }
        toolbar={
          <Toolbar>
            <SearchInput value={search} onValueChange={setSearch} placeholder="Search by rep or status" aria-label="Search targets" containerClassName="w-full sm:max-w-sm" />
          </Toolbar>
        }
      />

      {/* Set Target */}
      <Modal
        open={showSetTargetModal}
        onClose={() => setShowSetTargetModal(false)}
        title="Set target"
        description="Dates are set automatically from the period you choose."
        size="md"
        dismissible={!submitting}
        footer={
          <>
            <Button variant="outline" onClick={() => setShowSetTargetModal(false)} disabled={submitting}>Cancel</Button>
            <Button type="submit" form="target-form" loading={submitting}>Set target</Button>
          </>
        }
      >
        <form id="target-form" noValidate onSubmit={(e) => { e.preventDefault(); handleSetTarget(); }} className="space-y-4">
          {actionError && <Alert tone="danger" onDismiss={() => setActionError('')}>{actionError}</Alert>}
          {usersError && (
            <Alert tone="danger" title="Team list didn't load" actions={<Button size="sm" variant="outline" onClick={fetchUsers}>Try again</Button>}>
              {usersError}
            </Alert>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <Select id="target-metric" data-autofocus label="Metric" required placeholder="Select metric" value={newTarget.metric} error={fieldErrors.metric}
              onChange={(e) => { setNewTarget({ ...newTarget, metric: e.target.value as typeof newTarget.metric }); setFieldErrors(p => ({ ...p, metric: undefined })); }}
              options={METRIC_OPTIONS.map(m => ({ value: m.value, label: m.label }))} />
            <Select id="target-period" label="Period" required value={newTarget.period}
              onChange={(e) => setNewTarget({ ...newTarget, period: e.target.value as PeriodOption })}
              options={[
                { value: 'Daily', label: 'Daily' },
                { value: 'Weekly', label: 'Weekly' },
                { value: 'Monthly', label: 'Monthly' },
                { value: 'Quarterly', label: 'Quarterly' },
                // Annual targets are Organization Admin's call — Sales Managers work at the monthly/tactical level.
                ...(role === 'Organization Admin' ? [{ value: 'Annual', label: 'Annual' }] : []),
              ]} />
          </div>
          <Select id="target-user" label="User" required placeholder="Select user" value={newTarget.user} error={fieldErrors.user}
            onChange={(e) => { setNewTarget({ ...newTarget, user: e.target.value }); setFieldErrors(p => ({ ...p, user: undefined })); }}
            options={orgUsers.map(u => ({ value: u.id, label: u.name }))} />
          <Input id="target-target" label="Target value" required type="number" min={0}
            inputMode={isMoneyMetric(newTarget.metric || undefined) ? 'decimal' : 'numeric'}
            helperText={newTarget.metric ? (isMoneyMetric(newTarget.metric) ? 'Amount in ₹' : 'Count') : undefined}
            placeholder="Enter target value" value={newTarget.target} error={fieldErrors.target}
            onChange={(e) => { setNewTarget({ ...newTarget, target: e.target.value }); setFieldErrors(p => ({ ...p, target: undefined })); }} />
          {newTarget.target && Number(newTarget.target) > 0 && newTarget.metric && (
            <p className="text-sm text-foreground-muted">
              Target: <span className="font-medium tabular-nums text-gray-900">{formatMetric(Number(newTarget.target), newTarget.metric, false)}</span>
              {' '}· {formatDate(defaultDateRangeFor(newTarget.period).startDate)} – {formatDate(defaultDateRangeFor(newTarget.period).endDate)}
            </p>
          )}
        </form>
      </Modal>
    </PageSection>
  );
}
