import { useState, useEffect } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardHeader,
  DataTable,
  DataTableColumn,
  EmptyState,
  Input,
  Modal,
  PageHeader,
  PageSection,
  ProgressBar,
  Select,
  StatCard,
  StatGrid,
  StatusPill,
  formatINR,
  formatNumber,
  useToast,
} from '@bharatsales/ui';
import { IncentivesService } from '@bharatsales/api-client';
import { IncentivePlan, IncentivePayout } from '@bharatsales/shared-types';
import { Plus, Gift, IndianRupee, Users, Clock, Wallet } from 'lucide-react';
import { ErrorState, getErrorMessage } from '../../../components/common/ErrorState';

const INCENTIVE_TYPES = ['Volume', 'Value', 'New Outlet Acquisition', 'Collection'];

const EMPTY_PLAN = { name: '', type: 'Volume', slab: '', target: '', eligible: 'All Reps', payout: '' };

export default function IncentivesPage() {
  const toast = useToast();

  const [incentivePlans, setIncentivePlans] = useState<IncentivePlan[]>([]);
  const [payouts, setPayouts] = useState<IncentivePayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; target?: string; payout?: string }>({});
  const [newPlan, setNewPlan] = useState(EMPTY_PLAN);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const [plans, items] = await Promise.all([
        IncentivesService.getIncentivePlans(),
        IncentivesService.getIncentivePayouts()
      ]);
      setIncentivePlans(plans || []);
      setPayouts(items || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setLoadError(getErrorMessage(error) ?? 'Failed to load incentives.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async () => {
    const errs: typeof fieldErrors = {};
    if (!newPlan.name.trim()) errs.name = 'Enter a plan name';
    if (!newPlan.target.trim()) errs.target = 'Enter the target, e.g. 100 orders';
    if (!newPlan.payout.trim()) errs.payout = 'Enter the payout, e.g. ₹5,000';
    setFieldErrors(errs);
    const first = Object.keys(errs)[0];
    if (first) { document.getElementById(`plan-${first}`)?.focus(); return; }
    if (!newPlan.name || !newPlan.target || !newPlan.payout) return;
    setCreating(true);
    setFormError('');
    try {
      await IncentivesService.createIncentivePlan({
        name: newPlan.name,
        type: newPlan.type,
        slab: newPlan.slab || 'N/A',
        target: newPlan.target,
        eligible: newPlan.eligible,
        payout: newPlan.payout,
        status: 'Active'
      });
      setShowCreateModal(false);
      setNewPlan(EMPTY_PLAN);
      toast.success('Incentive plan created');
      fetchData(); // Refresh the list
    } catch (error) {
      console.error('Failed to create plan', error);
      setFormError('Failed to create incentive plan.');
    } finally {
      setCreating(false);
    }
  };

  const openCreate = () => {
    setFormError('');
    setFieldErrors({});
    setShowCreateModal(true);
  };

  const setField = (key: keyof typeof EMPTY_PLAN, value: string) => {
    setNewPlan(prev => ({ ...prev, [key]: value }));
    if (key in fieldErrors) setFieldErrors(prev => ({ ...prev, [key]: undefined }));
  };

  const achievementOf = (p: IncentivePayout) => (p.target ? Math.round((p.achieved / p.target) * 100) : 0);
  const totalPayout = payouts.reduce((s, p) => s + p.incentive, 0);
  const pending = payouts.filter(p => p.status === 'Pending').length;
  const errorNode = loadError && <ErrorState title="Couldn't load incentives" message={loadError} onRetry={fetchData} className="border-0" />;

  const planColumns: DataTableColumn<IncentivePlan>[] = [
    { id: 'name', header: 'Plan', accessor: 'name', sortable: true, primary: true, cell: (p) => <span className="font-medium text-gray-900">{p.name}</span> },
    { id: 'type', header: 'Type', accessor: 'type', sortable: true, cell: (p) => <Badge tone="primary" size="sm">{p.type}</Badge> },
    { id: 'slab', header: 'Slab', accessor: 'slab', hideBelow: 'lg', cell: (p) => <span className="text-foreground-muted">{p.slab || '—'}</span> },
    { id: 'target', header: 'Target', accessor: 'target', hideBelow: 'sm' },
    { id: 'eligible', header: 'Eligible', accessor: 'eligible', hideBelow: 'md' },
    { id: 'payout', header: 'Payout', accessor: 'payout', align: 'right', cell: (p) => <span className="font-medium text-gray-900">{p.payout}</span> },
    { id: 'status', header: 'Status', accessor: 'status', sortable: true, cell: (p) => <StatusPill status={p.status} /> },
  ];

  const payoutColumns: DataTableColumn<IncentivePayout>[] = [
    { id: 'rep', header: 'Rep', accessor: 'rep', sortable: true, primary: true, cell: (p) => <span className="font-medium text-gray-900">{p.rep}</span> },
    { id: 'target', header: 'Target', accessor: 'target', sortable: true, align: 'right', searchable: false, hideBelow: 'md',
      cell: (p) => <span className="tabular-nums text-foreground-muted">{formatINR(p.target)}</span> },
    { id: 'achieved', header: 'Achieved', accessor: 'achieved', sortable: true, align: 'right', searchable: false, hideBelow: 'sm',
      cell: (p) => <span className="tabular-nums text-gray-900">{formatINR(p.achieved)}</span> },
    {
      id: 'achievement', header: 'Achievement', accessor: achievementOf, sortable: true, searchable: false,
      cell: (p) => {
        const a = achievementOf(p);
        return (
          <ProgressBar value={a} label={`Achievement for ${p.rep}`} tone={a >= 100 ? 'success' : 'warning'} showValue className="min-w-[8rem]" />
        );
      },
    },
    { id: 'incentive', header: 'Incentive', accessor: 'incentive', sortable: true, align: 'right', searchable: false,
      cell: (p) => <span className="font-semibold tabular-nums text-gray-900">{formatINR(p.incentive)}</span> },
    { id: 'status', header: 'Status', accessor: 'status', sortable: true, cell: (p) => <StatusPill status={p.status} /> },
  ];

  return (
    <PageSection>
      <PageHeader
        title="Incentives"
        description="Manage incentive plans and track rep payouts."
        actions={<Button variant="accent" leftIcon={<Plus />} onClick={openCreate}>Create incentive plan</Button>}
      />

      <StatGrid columns={4}>
        <StatCard label="Active plans" value={formatNumber(incentivePlans.length)} icon={<Gift />} loading={loading} />
        <StatCard label="Total payout" value={formatINR(totalPayout, { compact: true })} icon={<IndianRupee />} tone="success" loading={loading} />
        <StatCard label="Eligible reps" value={formatNumber(payouts.filter(p => p.incentive > 0).length)} icon={<Users />} tone="info" loading={loading} />
        <StatCard label="Pending approval" value={formatNumber(pending)} icon={<Clock />} tone={pending > 0 ? 'warning' : 'neutral'} loading={loading} />
      </StatGrid>

      <Card>
        <CardHeader title="Incentive plans" description="Rules that decide how reps earn incentives." divided />
        <DataTable
          caption="Incentive plans"
          itemLabel="plans"
          bordered={false}
          data={incentivePlans}
          columns={planColumns}
          loading={loading}
          error={errorNode}
          initialSort={{ id: 'name', direction: 'asc' }}
          mobileLayout="cards"
          emptyState={
            <EmptyState size="compact" icon={<Gift />} title="No incentive plans yet" description="Create a plan to reward reps for volume, value, new outlets or collections."
              action={<Button leftIcon={<Plus />} onClick={openCreate}>Create incentive plan</Button>} />
          }
        />
      </Card>

      <Card>
        <CardHeader title="Payouts" description="Incentive earned per rep." divided />
        <DataTable
          caption="Payouts"
          itemLabel="payouts"
          bordered={false}
          data={payouts}
          columns={payoutColumns}
          loading={loading}
          error={errorNode}
          initialSort={{ id: 'incentive', direction: 'desc' }}
          mobileLayout="cards"
          emptyState={<EmptyState size="compact" icon={<Wallet />} title="No payouts yet" description="Payouts appear here once reps start earning against a plan." />}
        />
      </Card>

      {/* Create Incentive Plan */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create incentive plan"
        size="md"
        dismissible={!creating}
        footer={
          <>
            <Button variant="outline" onClick={() => setShowCreateModal(false)} disabled={creating}>Cancel</Button>
            <Button type="submit" form="plan-form" loading={creating}>Create plan</Button>
          </>
        }
      >
        <form id="plan-form" noValidate onSubmit={(e) => { e.preventDefault(); handleCreatePlan(); }} className="space-y-4">
          {formError && <Alert tone="danger" onDismiss={() => setFormError('')}>{formError}</Alert>}
          <Input id="plan-name" data-autofocus label="Plan name" required placeholder="e.g. Q3 volume booster" value={newPlan.name} error={fieldErrors.name}
            onChange={(e) => setField('name', e.target.value)} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Select label="Type" value={newPlan.type} onChange={(e) => setField('type', e.target.value)}
              options={INCENTIVE_TYPES.map(t => ({ value: t, label: t }))} />
            <Input label="Slab / tier" optional placeholder="e.g. Tier A" value={newPlan.slab} onChange={(e) => setField('slab', e.target.value)} />
            <Input id="plan-target" label="Target" required placeholder="e.g. 100 orders" value={newPlan.target} error={fieldErrors.target}
              onChange={(e) => setField('target', e.target.value)} />
            <Input id="plan-payout" label="Payout" required placeholder="e.g. ₹5,000" value={newPlan.payout} error={fieldErrors.payout}
              onChange={(e) => setField('payout', e.target.value)} />
          </div>
          <Input label="Eligible" placeholder="e.g. All reps" value={newPlan.eligible} onChange={(e) => setField('eligible', e.target.value)} />
        </form>
      </Modal>
    </PageSection>
  );
}
