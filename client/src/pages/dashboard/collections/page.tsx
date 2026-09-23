import { useState, useEffect, useMemo } from 'react';
import { AlertTriangle, CheckCircle2, Clock, IndianRupee, Plus, ShieldCheck } from 'lucide-react';
import { PaymentCollection, Outlet } from '@bharatsales/shared-types';
import { CollectionsService, OutletsService } from '@bharatsales/api-client';
import {
  Alert,
  Button,
  ConfirmDialog,
  DataTable,
  type DataTableColumn,
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
  Tabs,
  Toolbar,
  formatDate,
  formatINR,
  useToast,
} from '@bharatsales/ui';
import { ErrorState, getErrorMessage } from '../../../components/common/ErrorState';

type PaymentMode = PaymentCollection['paymentMode'];
type StatusTab = 'all' | 'Pending' | 'Cleared' | 'Bounced';

const PAYMENT_MODES: { value: PaymentMode; label: string }[] = [
  { value: 'Cash', label: 'Cash' },
  { value: 'UPI', label: 'UPI' },
  { value: 'Cheque', label: 'Cheque' },
  { value: 'Bank Transfer', label: 'Bank transfer' },
];

const EMPTY_PAYMENT = { outletId: '', invoiceId: '', amount: '', paymentMode: 'Cash' as PaymentMode, referenceNumber: '' };

export default function CollectionsPage() {
  const toast = useToast();
  const [collections, setCollections] = useState<PaymentCollection[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState<StatusTab>('all');

  const [showModal, setShowModal] = useState(false);
  const [newPayment, setNewPayment] = useState(EMPTY_PAYMENT);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [confirmReverseId, setConfirmReverseId] = useState<string | null>(null);

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const [colData, outData] = await Promise.all([CollectionsService.getCollections(), OutletsService.getOutlets()]);
      setCollections(colData || []);
      setOutlets(outData || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setLoadError(getErrorMessage(error) ?? 'Failed to load payments.');
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPayment.outletId || !newPayment.amount) {
      setFormError('Outlet and Amount are required.');
      return;
    }
    setFormError('');
    setSaving(true);

    try {
      await CollectionsService.createCollection({
        outletId: newPayment.outletId,
        invoiceId: newPayment.invoiceId || undefined,
        amount: parseFloat(newPayment.amount),
        paymentMode: newPayment.paymentMode,
        referenceNumber: newPayment.referenceNumber || undefined,
        receiptNumber: `REC-${Date.now()}`,
        status: 'Cleared', // auto-settle since admin is entering it
        collectionDate: new Date().toISOString(),
      });

      setShowModal(false);
      setNewPayment(EMPTY_PAYMENT);
      toast.success(`Payment of ${formatINR(parseFloat(newPayment.amount))} recorded`);
      await fetchCollections();
    } catch (error: unknown) {
      console.error('Failed to record payment', error);
      setFormError(getErrorMessage(error) || 'Failed to record payment.');
    } finally {
      setSaving(false);
    }
  };

  const handleVerify = async (id: string) => {
    setVerifyingId(id);
    try {
      await CollectionsService.updateCollectionStatus(id, 'Cleared');
      setCollections(collections.map((c) => (c.id === id ? { ...c, status: 'Cleared' } : c)));
      toast.success('Payment verified');
    } catch (error: unknown) {
      console.error('Failed to verify collection', error);
      toast.error(getErrorMessage(error) || 'Failed to verify collection.');
    } finally {
      setVerifyingId(null);
    }
  };

  const handleReverse = async (id: string) => {
    try {
      await CollectionsService.reverseCollection(id);
      setCollections(collections.map((c) => (c.id === id ? { ...c, status: 'Bounced' } : c)));
      toast.success('Payment reversed');
    } catch (error: unknown) {
      console.error('Failed to reverse collection', error);
      toast.error(getErrorMessage(error) || 'Failed to reverse collection.');
    } finally {
      setConfirmReverseId(null);
    }
  };

  const outletName = (id: string) => outlets.find((o) => o.id === id)?.name;

  const sum = (list: PaymentCollection[]) => list.reduce((s, c) => s + (c.amount || 0), 0);
  const cleared = collections.filter((c) => c.status === 'Cleared');
  const pending = collections.filter((c) => c.status === 'Pending');
  const bounced = collections.filter((c) => c.status === 'Bounced');

  const visible = useMemo(
    () => (statusTab === 'all' ? collections : collections.filter((c) => c.status === statusTab)),
    [collections, statusTab],
  );

  const reverseTarget = collections.find((c) => c.id === confirmReverseId);
  const needsReference = newPayment.paymentMode === 'Cheque' || newPayment.paymentMode === 'UPI' || newPayment.paymentMode === 'Bank Transfer';
  const initialLoad = loading && collections.length === 0;

  const openRecord = () => {
    setFormError('');
    setShowModal(true);
  };

  const columns: DataTableColumn<PaymentCollection>[] = [
    {
      id: 'receipt',
      header: 'Receipt',
      accessor: 'receiptNumber',
      primary: true,
      sortable: true,
      cell: (c) => <span className="font-medium text-gray-900">{c.receiptNumber}</span>,
    },
    {
      id: 'date',
      header: 'Date',
      accessor: 'collectionDate',
      sortable: true,
      searchable: false,
      cell: (c) => <span className="text-foreground-muted">{formatDate(c.collectionDate)}</span>,
    },
    {
      id: 'outlet',
      header: 'Outlet',
      accessor: (c) => `${outletName(c.outletId) ?? ''} ${c.outletId}`,
      sortable: true,
      cell: (c) => {
        const name = outletName(c.outletId);
        return name ? (
          <span className="font-medium text-gray-900">{name}</span>
        ) : (
          <span className="font-medium text-foreground-muted" title={c.outletId}>Unknown outlet</span>
        );
      },
    },
    {
      id: 'mode',
      header: 'Mode',
      accessor: 'paymentMode',
      hideBelow: 'md',
      cell: (c) => (
        <div>
          <p className="text-gray-700">{c.paymentMode}</p>
          {c.referenceNumber && <p className="text-xs text-foreground-subtle lg:hidden">Ref {c.referenceNumber}</p>}
        </div>
      ),
    },
    {
      id: 'reference',
      header: 'Reference',
      accessor: 'referenceNumber',
      hideBelow: 'lg',
      hideInCard: true,
      cell: (c) => <span className="text-foreground-muted">{c.referenceNumber || '—'}</span>,
    },
    {
      id: 'amount',
      header: 'Amount',
      accessor: 'amount',
      align: 'right',
      sortable: true,
      searchable: false,
      cell: (c) => <span className="font-semibold tabular-nums text-gray-900">{formatINR(c.amount)}</span>,
    },
    { id: 'status', header: 'Status', accessor: 'status', searchable: false, cell: (c) => <StatusPill status={c.status} /> },
    {
      id: 'actions',
      header: <span className="sr-only">Actions</span>,
      align: 'right',
      cell: (c) => (
        <div className="flex justify-end gap-2">
          {c.status === 'Pending' && (
            <Button size="sm" variant="outline" leftIcon={<ShieldCheck />} loading={verifyingId === c.id} onClick={() => handleVerify(c.id)}>
              Verify
            </Button>
          )}
          {c.status === 'Cleared' && c.amount > 0 && (
            <Button size="sm" variant="ghost" className="text-danger-700 hover:bg-danger-50" onClick={() => setConfirmReverseId(c.id)}>
              Reverse
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <PageSection>
      <PageHeader
        title="Payments"
        description="Payments collected from the outlets you supply."
        actions={
          <Button variant="accent" leftIcon={<Plus />} onClick={openRecord}>
            Record payment
          </Button>
        }
      />

      <StatGrid columns={3}>
        <StatCard
          label="Collected (cleared)"
          value={formatINR(sum(cleared), { compact: true })}
          hint={`${cleared.length} payments`}
          icon={<CheckCircle2 />}
          tone="success"
          loading={initialLoad}
          onClick={() => setStatusTab('Cleared')}
        />
        <StatCard
          label="Awaiting verification"
          value={formatINR(sum(pending), { compact: true })}
          hint={`${pending.length} payments`}
          icon={<Clock />}
          tone="warning"
          loading={initialLoad}
          onClick={() => setStatusTab('Pending')}
        />
        <StatCard
          label="Bounced / reversed"
          value={formatINR(sum(bounced), { compact: true })}
          hint={`${bounced.length} payments`}
          icon={<AlertTriangle />}
          tone="danger"
          loading={initialLoad}
          onClick={() => setStatusTab('Bounced')}
        />
      </StatGrid>

      <DataTable
        caption="Payments"
        itemLabel="payments"
        data={visible}
        columns={columns}
        getRowId={(c) => c.id}
        loading={initialLoad}
        error={loadError ? <ErrorState title="Couldn't load payments" message={loadError} onRetry={fetchCollections} className="border-0" /> : undefined}
        globalFilter={search}
        initialSort={{ id: 'date', direction: 'desc' }}
        mobileLayout="cards"
        toolbar={
          <div className="space-y-3">
            <Tabs
              id="payment-status"
              aria-label="Filter payments by status"
              variant="pills"
              value={statusTab}
              onValueChange={(v) => setStatusTab(v as StatusTab)}
              items={[
                { value: 'all', label: 'All', count: collections.length },
                { value: 'Pending', label: 'Pending', count: pending.length },
                { value: 'Cleared', label: 'Cleared', count: cleared.length },
                { value: 'Bounced', label: 'Bounced', count: bounced.length },
              ]}
            />
            <Toolbar>
              <SearchInput
                value={search}
                onValueChange={setSearch}
                placeholder="Search receipt, outlet or reference"
                aria-label="Search payments"
                containerClassName="w-full sm:max-w-sm"
              />
            </Toolbar>
          </div>
        }
        emptyState={
          statusTab === 'all' ? (
            <EmptyState
              icon={<IndianRupee />}
              title="No payments yet"
              description="Payments you record from your outlets will appear here."
              action={
                <Button leftIcon={<Plus />} onClick={openRecord}>
                  Record payment
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={<IndianRupee />}
              title="No payments with this status"
              action={
                <Button variant="outline" onClick={() => setStatusTab('all')}>
                  View all payments
                </Button>
              }
            />
          )
        }
      />

      {/* Record Payment Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        dismissible={!saving}
        title="Record payment"
        description="Payments you enter are marked as cleared straight away."
        footer={
          <>
            <Button variant="outline" onClick={() => setShowModal(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" form="record-payment-form" loading={saving}>
              Save payment
            </Button>
          </>
        }
      >
        <form id="record-payment-form" onSubmit={handleRecordPayment} className="space-y-3">
          {formError && (
            <Alert tone="danger" onDismiss={() => setFormError('')}>
              {formError}
            </Alert>
          )}
          <Select
            label="Outlet"
            required
            placeholder="Select outlet"
            options={outlets.map((o) => ({ value: o.id, label: o.name }))}
            value={newPayment.outletId}
            onChange={(e) => setNewPayment({ ...newPayment, outletId: e.target.value })}
            data-autofocus
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Amount (₹)"
              required
              type="number"
              inputMode="decimal"
              min="1"
              step="0.01"
              leftIcon={<IndianRupee />}
              value={newPayment.amount}
              onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
            />
            <Select
              label="Payment mode"
              options={PAYMENT_MODES}
              value={newPayment.paymentMode}
              onChange={(e) => setNewPayment({ ...newPayment, paymentMode: e.target.value as PaymentMode })}
            />
          </div>
          {needsReference && (
            <Input
              label="Reference number"
              required
              placeholder="Txn ID / cheque no."
              helperText={newPayment.paymentMode === 'Cheque' ? 'Cheque number as printed' : 'UTR or transaction ID'}
              value={newPayment.referenceNumber}
              onChange={(e) => setNewPayment({ ...newPayment, referenceNumber: e.target.value })}
            />
          )}
        </form>
      </Modal>

      <ConfirmDialog
        open={!!confirmReverseId}
        onClose={() => setConfirmReverseId(null)}
        tone="danger"
        title="Reverse this payment?"
        description={
          <>
            {reverseTarget && (
              <>
                {formatINR(reverseTarget.amount)} ({reverseTarget.receiptNumber}) will be marked as bounced.{' '}
              </>
            )}
            This will reinstate invoice balances and can't be undone.
          </>
        }
        confirmLabel="Reverse payment"
        onConfirm={() => handleReverse(confirmReverseId!)}
      />
    </PageSection>
  );
}
