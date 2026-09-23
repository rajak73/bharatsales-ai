import { useState, useEffect } from 'react';
import {
  Alert,
  Button,
  CheckList,
  DataTable,
  DataTableColumn,
  Drawer,
  DropdownMenu,
  EmptyState,
  IconButton,
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
  formatNumber,
  useToast,
} from '@bharatsales/ui';
import { BeatsService, UsersService, OutletsService } from '@bharatsales/api-client';
import type { Beat, User, Outlet } from '@bharatsales/shared-types';
import { Target, Plus, MoreHorizontal, Eye, Pencil, Send, UserPlus, Route, FileEdit, CheckCircle2, Store } from 'lucide-react';
import { useCurrentUser } from '../../../contexts/CurrentUserContext';
import { ErrorState, getErrorMessage } from '../../../components/common/ErrorState';
import { localISODate } from '../../../lib/localDate';

function outletId(o: string | { id: string; name: string }): string {
  return typeof o === 'string' ? o : o.id;
}

function outletLabel(o: string | { id: string; name: string }, outlets: Outlet[]): string {
  if (typeof o !== 'string') return o.name;
  return outlets.find(x => x.id === o)?.name || o;
}

/** Filterable outlet checklist for the beat template form. */
function OutletPicker({ outlets, selected, onChange }: { outlets: Outlet[]; selected: string[]; onChange: (ids: string[]) => void }) {
  return (
    <CheckList
      label="Outlets in route"
      filterPlaceholder="Filter outlets"
      maxHeightClassName="max-h-64"
      emptyText="No outlets yet. Add outlets first, then build the route."
      items={outlets.map((o) => ({ id: o.id, label: o.name }))}
      selected={selected}
      onToggle={(id, checked) => onChange(checked ? [...selected, id] : selected.filter((x) => x !== id))}
    />
  );
}

export default function BeatsPage() {
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBeat, setNewBeat] = useState<{ name: string; description: string; outletIds: string[] }>({ name: '', description: '', outletIds: [] });
  const [allBeats, setAllBeats] = useState<Beat[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [salesReps, setSalesReps] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const user = useCurrentUser();
  // Beat *templates* are Organization Admin's job (create/edit/publish); a
  // Sales Manager may only assign an already-published template to a rep.
  const canManageTemplates = user?.role === 'Organization Admin' || user?.role === 'Super Admin';
  const canAssign = canManageTemplates || user?.role === 'Sales Manager';
  const [viewingBeat, setViewingBeat] = useState<Beat | null>(null);
  const [editingBeat, setEditingBeat] = useState<Beat | null>(null);
  const [assigningBeat, setAssigningBeat] = useState<Beat | null>(null);
  const [assignForm, setAssignForm] = useState({ userId: '', date: '' });
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [savingBeat, setSavingBeat] = useState(false);
  const [nameError, setNameError] = useState('');
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    fetchBeats();
    fetchUsers();
    fetchOutlets();

  }, []);

  const fetchBeats = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const data = await BeatsService.getBeats();
      setAllBeats(data || []);
    } catch (error) {
      console.error('Failed to fetch beats:', error);
      setLoadError(getErrorMessage(error) ?? 'Failed to load beats.');
    } finally {
      setLoading(false);
    }
  };

  const [lookupError, setLookupError] = useState('');
  const fetchUsers = async () => {
    try {
      const users = await UsersService.getUsers();
      setSalesReps(users.filter(u => u.role === 'Sales Representative'));
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setLookupError(getErrorMessage(error) ?? "Couldn't load your sales reps.");
    }
  };

  const fetchOutlets = async () => {
    try {
      const data = await OutletsService.getOutlets();
      setOutlets(data || []);
    } catch (error) {
      console.error('Failed to fetch outlets:', error);
      setLookupError(getErrorMessage(error) ?? "Couldn't load outlets.");
    }
  };

  // Text search is applied by the table; status filter here.
  const filteredBeats = allBeats.filter(beat => statusFilter === 'All Statuses' || beat.status === statusFilter);

  const resetForm = () => setNewBeat({ name: '', description: '', outletIds: [] });

  const handleCreateBeat = async () => {
    if (!newBeat.name) return;
    setSavingBeat(true);
    try {
      await BeatsService.createBeat({
        name: newBeat.name,
        description: newBeat.description || undefined,
        outlets: newBeat.outletIds,
      });
      toast.success({ title: `Beat template "${newBeat.name}" created`, description: 'Saved as a draft. Publish it to assign to reps.' });
      setShowCreateModal(false);
      resetForm();
      fetchBeats();
    } catch (err) {
      console.error('Failed to create beat', err);
      setActionError('Failed to create beat template.');
    } finally {
      setSavingBeat(false);
    }
  };

  const openEditModal = (beat: Beat) => {
    setNameError('');
    setActionError('');
    setEditingBeat(beat);
    setNewBeat({
      name: beat.name,
      description: beat.description || '',
      outletIds: beat.outlets.map(outletId),
    });
  };

  const handleUpdateBeat = async () => {
    if (!editingBeat || !newBeat.name) return;
    setActionError('');
    setSavingBeat(true);
    try {
      await BeatsService.updateBeat(editingBeat.id, {
        name: newBeat.name,
        description: newBeat.description || undefined,
        outlets: newBeat.outletIds,
      } as any);
      toast.success(`Beat template "${newBeat.name}" updated`);
      setEditingBeat(null);
      resetForm();
      fetchBeats();
    } catch (err) {
      console.error('Failed to update beat', err);
      setActionError('Failed to update beat template.');
    } finally {
      setSavingBeat(false);
    }
  };

  const handlePublish = async (beat: Beat) => {
    setPublishingId(beat.id);
    setActionError('');
    try {
      await BeatsService.publishBeat(beat.id);
      toast.success(`Beat "${beat.name}" published`);
      fetchBeats();
    } catch (err) {
      console.error('Failed to publish beat', err);
      setActionError('Failed to publish beat.');
    } finally {
      setPublishingId(null);
    }
  };

  const openAssignModal = (beat: Beat) => {
    setActionError('');
    setAssigningBeat(beat);
    setAssignForm({ userId: '', date: localISODate() });
  };

  const handleAssign = async () => {
    if (!assigningBeat || !assignForm.userId || !assignForm.date) return;
    setAssigning(true);
    setActionError('');
    try {
      await BeatsService.assignBeat(assigningBeat.id, assignForm.userId, assignForm.date);
      toast.success(`"${assigningBeat.name}" assigned`);
      setAssigningBeat(null);
      fetchBeats();
    } catch (err: any) {
      console.error('Failed to assign beat', err);
      setActionError(err?.response?.data?.message || 'Failed to assign beat.');
    } finally {
      setAssigning(false);
    }
  };

  const openCreate = () => {
    resetForm();
    setNameError('');
    setActionError('');
    setShowCreateModal(true);
  };

  const closeForm = () => { setShowCreateModal(false); setEditingBeat(null); resetForm(); };

  const submitForm = () => {
    if (!newBeat.name.trim()) {
      setNameError('Enter a beat name');
      document.getElementById('beat-name')?.focus();
      return;
    }
    if (editingBeat) handleUpdateBeat();
    else handleCreateBeat();
  };

  const formOpen = (showCreateModal || !!editingBeat) && canManageTemplates;
  const anyDialogOpen = formOpen || (!!assigningBeat && canAssign);

  const columns: DataTableColumn<Beat>[] = [
    {
      id: 'name', header: 'Beat', accessor: (b) => `${b.name} ${b.description ?? ''}`, sortable: true, primary: true,
      sortFn: (a, b) => a.name.localeCompare(b.name, 'en-IN'),
      cell: (b) => (
        <div className="min-w-0">
          <div className="truncate font-medium text-gray-900">{b.name}</div>
          {b.description && <div className="line-clamp-1 text-xs text-foreground-subtle">{b.description}</div>}
        </div>
      ),
    },
    { id: 'outlets', header: 'Outlets', accessor: (b) => b.outlets.length, sortable: true, align: 'right', searchable: false,
      cell: (b) => <span className="tabular-nums">{formatNumber(b.outlets.length)}</span> },
    { id: 'version', header: 'Version', accessor: 'version', sortable: true, searchable: false, hideBelow: 'md', align: 'right',
      cell: (b) => <span className="tabular-nums text-foreground-muted">v{b.version ?? 1}</span> },
    { id: 'status', header: 'Status', accessor: 'status', sortable: true, searchable: false, cell: (b) => <StatusPill status={b.status} /> },
    {
      id: 'actions', header: <span className="sr-only">Actions</span>, align: 'right',
      cell: (b) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          {canManageTemplates && b.status === 'Draft' && (
            <Button size="sm" variant="outline" leftIcon={<Send />} loading={publishingId === b.id} onClick={() => handlePublish(b)} className="hidden sm:inline-flex">
              Publish
            </Button>
          )}
          {canAssign && b.status === 'Active' && (
            <Button size="sm" variant="outline" leftIcon={<UserPlus />} onClick={() => openAssignModal(b)} className="hidden sm:inline-flex">
              Assign
            </Button>
          )}
          <DropdownMenu
            trigger={(p) => <IconButton {...p} size="sm" aria-label={`Actions for ${b.name}`} icon={<MoreHorizontal />} />}
            items={[
              { label: 'View route', icon: <Eye className="h-4 w-4" />, onSelect: () => setViewingBeat(b) },
              ...(canManageTemplates ? [
                { label: 'Edit template', icon: <Pencil className="h-4 w-4" />, onSelect: () => openEditModal(b) },
                { label: publishingId === b.id ? 'Publishing…' : 'Publish', icon: <Send className="h-4 w-4" />, disabled: b.status !== 'Draft' || publishingId === b.id, onSelect: () => handlePublish(b) },
              ] : []),
              ...(canAssign ? [
                { label: 'Assign to rep', icon: <UserPlus className="h-4 w-4" />, disabled: b.status !== 'Active', hint: b.status !== 'Active' ? 'Publish first' : undefined, onSelect: () => openAssignModal(b) },
              ] : []),
            ]}
          />
        </div>
      ),
    },
  ];

  const hasFilters = !!searchTerm || statusFilter !== 'All Statuses';

  return (
    <PageSection>
      <PageHeader
        title="Beat planning"
        description="Build route templates, publish them and assign them to reps."
        actions={canManageTemplates ? <Button variant="accent" leftIcon={<Plus />} onClick={openCreate}>Create beat template</Button> : undefined}
      />

      {actionError && !anyDialogOpen && (
        <Alert tone="danger" title="Something went wrong" onDismiss={() => setActionError('')}>{actionError}</Alert>
      )}

      <StatGrid columns={3}>
        <StatCard label="Total templates" value={formatNumber(allBeats.length)} icon={<Route />} loading={loading} />
        <StatCard label="Published" value={formatNumber(allBeats.filter(b => b.status === 'Active').length)} icon={<CheckCircle2 />} tone="success" loading={loading}
          onClick={() => setStatusFilter('Active')} />
        <StatCard label="Drafts" value={formatNumber(allBeats.filter(b => b.status === 'Draft').length)} icon={<FileEdit />} tone="warning" loading={loading}
          hint={canManageTemplates ? 'Publish to make assignable' : undefined} onClick={() => setStatusFilter('Draft')} />
      </StatGrid>

      <DataTable
        caption="Beat templates"
        itemLabel="beats"
        data={filteredBeats}
        columns={columns}
        loading={loading}
        error={loadError && <ErrorState title="Couldn't load beats" message={loadError} onRetry={fetchBeats} className="border-0" />}
        globalFilter={searchTerm}
        initialSort={{ id: 'name', direction: 'asc' }}
        onRowClick={(b) => setViewingBeat(b)}
        selectedRowId={viewingBeat?.id}
        mobileLayout="cards"
        emptyState={
          hasFilters ? (
            <EmptyState size="compact" title="No beats match" description="Try a different search or status."
              action={<Button variant="outline" onClick={() => { setSearchTerm(''); setStatusFilter('All Statuses'); }}>Clear filters</Button>} />
          ) : (
            <EmptyState icon={<Target />} title="No beat templates yet"
              description={canManageTemplates ? 'Create a template with the outlets a rep should visit, then publish and assign it.' : 'Published beat templates will appear here for you to assign.'}
              action={canManageTemplates ? <Button leftIcon={<Plus />} onClick={openCreate}>Create beat template</Button> : undefined} />
          )
        }
        toolbar={
          <Toolbar>
            <SearchInput value={searchTerm} onValueChange={setSearchTerm} placeholder="Search beats" aria-label="Search beats" containerClassName="w-full sm:max-w-sm" />
            <Select hideLabel label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'All Statuses', label: 'All statuses' },
                { value: 'Draft', label: 'Draft' },
                { value: 'Active', label: 'Active' },
                { value: 'Archived', label: 'Archived' },
              ]} />
          </Toolbar>
        }
      />

      {/* Create / Edit Beat Template */}
      <Drawer
        open={formOpen}
        onClose={closeForm}
        title={editingBeat ? 'Edit beat template' : 'Create beat template'}
        description={editingBeat ? undefined : 'New templates are saved as drafts.'}
        size="md"
        dismissible={!savingBeat}
        footer={
          <>
            <Button variant="outline" onClick={closeForm} disabled={savingBeat}>Cancel</Button>
            <Button type="submit" form="beat-form" loading={savingBeat}>{editingBeat ? 'Save changes' : 'Create draft'}</Button>
          </>
        }
      >
        <form id="beat-form" noValidate onSubmit={(e) => { e.preventDefault(); submitForm(); }} className="space-y-4">
          {actionError && <Alert tone="danger" onDismiss={() => setActionError('')}>{actionError}</Alert>}
          <Input id="beat-name" data-autofocus label="Beat name" required placeholder="e.g. Andheri West – Monday" value={newBeat.name} error={nameError}
            onChange={(e) => { setNewBeat({ ...newBeat, name: e.target.value }); setNameError(''); }} />
          <Input label="Description" optional value={newBeat.description} onChange={(e) => setNewBeat({ ...newBeat, description: e.target.value })} />
          <OutletPicker outlets={outlets} selected={newBeat.outletIds} onChange={(ids) => setNewBeat(prev => ({ ...prev, outletIds: ids }))} />
        </form>
      </Drawer>

      {/* Assign Beat */}
      <Modal
        open={!!assigningBeat && canAssign}
        onClose={() => setAssigningBeat(null)}
        title="Assign beat"
        description={assigningBeat ? <>Assign <span className="font-medium text-gray-900">{assigningBeat.name}</span> to a rep for a day.</> : undefined}
        size="sm"
        dismissible={!assigning}
        footer={
          <>
            <Button variant="outline" onClick={() => setAssigningBeat(null)} disabled={assigning}>Cancel</Button>
            <Button onClick={handleAssign} loading={assigning} disabled={!assignForm.userId || !assignForm.date}>Assign beat</Button>
          </>
        }
      >
        <div className="space-y-4">
          {actionError && <Alert tone="danger" onDismiss={() => setActionError('')}>{actionError}</Alert>}
          {lookupError && (
            <Alert tone="danger" title="Sales reps didn't load" actions={<Button size="sm" variant="outline" onClick={() => { setLookupError(''); fetchUsers(); }}>Try again</Button>}>
              {lookupError}
            </Alert>
          )}
          <Select data-autofocus label="Sales representative" required value={assignForm.userId} placeholder="Select rep"
            helperText={salesReps.length === 0 ? 'No sales reps found in your organisation.' : undefined}
            onChange={(e) => setAssignForm({ ...assignForm, userId: e.target.value })}
            options={salesReps.map(r => ({ value: r.id, label: r.name }))} />
          <Input label="Date" required type="date" value={assignForm.date} onChange={(e) => setAssignForm({ ...assignForm, date: e.target.value })} />
        </div>
      </Modal>

      {/* View Beat */}
      <Drawer
        open={!!viewingBeat}
        onClose={() => setViewingBeat(null)}
        title={viewingBeat?.name ?? ''}
        description={viewingBeat?.description || undefined}
        size="md"
        footer={viewingBeat && (canManageTemplates || (canAssign && viewingBeat.status === 'Active')) ? (
          <>
            {canManageTemplates && (
              <Button variant="outline" leftIcon={<Pencil />} onClick={() => { const b = viewingBeat; setViewingBeat(null); openEditModal(b); }}>Edit</Button>
            )}
            {canAssign && viewingBeat.status === 'Active' && (
              <Button leftIcon={<UserPlus />} onClick={() => { const b = viewingBeat; setViewingBeat(null); openAssignModal(b); }}>Assign to rep</Button>
            )}
          </>
        ) : undefined}
      >
        {viewingBeat && (
          <div className="space-y-4">
            <dl className="grid grid-cols-3 gap-4">
              <div><dt className="text-xs text-foreground-subtle">Status</dt><dd className="mt-1"><StatusPill status={viewingBeat.status} size="sm" /></dd></div>
              <div><dt className="text-xs text-foreground-subtle">Version</dt><dd className="mt-1 text-sm font-medium tabular-nums">v{viewingBeat.version}</dd></div>
              <div><dt className="text-xs text-foreground-subtle">Outlets</dt><dd className="mt-1 text-sm font-medium tabular-nums">{formatNumber(viewingBeat.outlets.length)}</dd></div>
            </dl>
            <div>
              <h3 className="mb-2 text-sm font-semibold text-gray-900">Route</h3>
              {viewingBeat.outlets.length === 0 ? (
                <EmptyState size="compact" bordered icon={<Store />} title="No outlets in this route" description={canManageTemplates ? 'Edit the template to add outlets.' : undefined} />
              ) : (
                <ol className="divide-y divide-border rounded-lg border border-border">
                  {viewingBeat.outlets.map((o, i) => (
                    <li key={outletId(o)} className="flex items-center gap-3 px-3 py-2.5 text-sm">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-50 text-xs font-semibold tabular-nums text-primary-700">{i + 1}</span>
                      <span className="min-w-0 truncate text-gray-900">{outletLabel(o, outlets)}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        )}
      </Drawer>
    </PageSection>
  );
}
