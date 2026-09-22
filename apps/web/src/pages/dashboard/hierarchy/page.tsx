import { useState, useEffect, useMemo } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { HierarchyService, UsersService } from '@bharatsales/api-client';
import { HierarchyNode, HierarchyLevel, User } from '@bharatsales/shared-types';
import {
  Alert,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  IconButton,
  Input,
  LoadingRegion,
  Modal,
  PageHeader,
  PageSection,
  Select,
  Skeleton,
  cn,
  useToast,
} from '@bharatsales/ui';
import { ChevronRight, Map, MapPin, Network, Pencil, Plus, Trash2, Users as UsersIcon } from 'lucide-react';
import { ErrorState, getErrorMessage } from '../../../components/common/ErrorState';

const PARENT_LEVEL: Record<HierarchyLevel, HierarchyLevel | null> = {
  Zone: null,
  Region: 'Zone',
  Area: 'Region',
  Territory: 'Area',
};

const EMPTY_NODE = { name: '', level: 'Zone' as HierarchyLevel, parentId: '', managerId: '' };

function Column({
  title,
  icon,
  count,
  action,
  children,
}: {
  title: string;
  icon: ReactNode;
  count?: number;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
  <Card className="flex min-h-[14rem] flex-col overflow-hidden xl:max-h-[34rem]">
    <div className="flex items-center justify-between gap-2 border-b border-border bg-surface-muted px-4 py-3">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
        <span className="text-foreground-subtle [&_svg]:h-4 [&_svg]:w-4" aria-hidden="true">{icon}</span>
        {title}
        {count !== undefined && <Badge size="sm" tone="neutral">{count}</Badge>}
      </h2>
      {action}
    </div>
    <div className="max-h-80 flex-1 overflow-y-auto p-2 xl:max-h-none">{children}</div>
  </Card>
);
}

export default function HierarchyPage() {
  const toast = useToast();
  const [nodes, setNodes] = useState<HierarchyNode[]>([]);
  const [managers, setManagers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState('');
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [deletingNodeId, setDeletingNodeId] = useState<string | null>(null);
  const [confirmDeleteNode, setConfirmDeleteNode] = useState<HierarchyNode | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [modalError, setModalError] = useState('');

  // Selection state
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [selectedTerritory, setSelectedTerritory] = useState<string | null>(null);

  // New Node Form State
  const [newNode, setNewNode] = useState<{
    name: string;
    level: HierarchyLevel;
    parentId: string;
    managerId: string;
  }>(EMPTY_NODE);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setLoadError('');
      const [hierarchyData, usersData] = await Promise.all([
        HierarchyService.getHierarchyNodes(),
        UsersService.getUsers()
      ]);
      setNodes(hierarchyData || []);
      // Filter out only managers (Area Managers, etc)
      setManagers(usersData?.filter((u: User) => ['Sales Manager', 'Organization Admin', 'Sales Representative'].includes(u.role)) || []);
    } catch (error) {
      console.error('Failed to fetch hierarchy data:', error);
      setLoadError(getErrorMessage(error) ?? "Couldn't load your hierarchy. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const zones = useMemo(() => nodes.filter(n => n.level === 'Zone'), [nodes]);
  const regions = useMemo(() => nodes.filter(n => n.level === 'Region' && n.parentId === selectedZone), [nodes, selectedZone]);
  const areas = useMemo(() => nodes.filter(n => n.level === 'Area' && n.parentId === selectedRegion), [nodes, selectedRegion]);
  const territories = useMemo(() => nodes.filter(n => n.level === 'Territory' && n.parentId === selectedArea), [nodes, selectedArea]);

  const levelCounts = useMemo(() => {
    const counts: Record<HierarchyLevel, number> = { Zone: 0, Region: 0, Area: 0, Territory: 0 };
    nodes.forEach((n) => { counts[n.level] = (counts[n.level] ?? 0) + 1; });
    return counts;
  }, [nodes]);

  const handleAddNode = async () => {
    try {
      if (!newNode.name) return;
      setModalError('');
      setSaving(true);

      await HierarchyService.createNode({
        name: newNode.name,
        level: newNode.level,
        parentId: newNode.parentId || undefined,
        managerId: newNode.managerId || undefined,
        status: 'Active'
      });

      toast.success(`${newNode.level} "${newNode.name}" created`);
      setShowAddModal(false);
      setNewNode(EMPTY_NODE);
      fetchData();
    } catch (error: any) {
      console.error('Error creating node:', error);
      setModalError(error?.response?.data?.message || 'Failed to create node');
    } finally {
      setSaving(false);
    }
  };

  const openModalFor = (level: HierarchyLevel, parentId: string) => {
    setEditingNodeId(null);
    setModalError('');
    setNameError('');
    setNewNode({ name: '', level, parentId, managerId: '' });
    setShowAddModal(true);
  };

  const openEditModal = (node: HierarchyNode) => {
    setEditingNodeId(node.id);
    setModalError('');
    setNameError('');
    setNewNode({
      name: node.name,
      level: node.level,
      parentId: node.parentId || '',
      managerId: node.managerId || '',
    });
    setShowAddModal(true);
  };

  const closeModal = () => {
    if (saving) return;
    setShowAddModal(false);
    setEditingNodeId(null);
  };

  const handleUpdateNode = async () => {
    if (!editingNodeId || !newNode.name) return;
    setModalError('');
    setSaving(true);
    try {
      await HierarchyService.updateNode(editingNodeId, {
        name: newNode.name,
        parentId: newNode.parentId || undefined,
        managerId: newNode.managerId || undefined,
      });
      toast.success(`${newNode.level} "${newNode.name}" updated`);
      setShowAddModal(false);
      setEditingNodeId(null);
      setNewNode(EMPTY_NODE);
      fetchData();
    } catch (error: any) {
      setModalError(error?.response?.data?.message || 'Failed to update node');
    } finally {
      setSaving(false);
    }
  };

  const onSubmitNode = (e: FormEvent) => {
    e.preventDefault();
    if (!newNode.name.trim()) {
      setNameError(`Enter a name for this ${newNode.level.toLowerCase()}`);
      document.getElementById('node-name')?.focus();
      return;
    }
    if (editingNodeId) handleUpdateNode();
    else handleAddNode();
  };

  const handleDeleteNode = async (node: HierarchyNode) => {
    setErrorMessage('');
    setDeletingNodeId(node.id);
    try {
      await HierarchyService.deleteNode(node.id);
      if (selectedZone === node.id) setSelectedZone(null);
      if (selectedRegion === node.id) setSelectedRegion(null);
      if (selectedArea === node.id) setSelectedArea(null);
      if (selectedTerritory === node.id) setSelectedTerritory(null);
      toast.success(`${node.level} "${node.name}" deleted`);
      fetchData();
    } catch (error: any) {
      setErrorMessage(error?.response?.data?.message || 'Failed to delete node. Reassign or delete its children first.');
    } finally {
      setDeletingNodeId(null);
      setConfirmDeleteNode(null);
    }
  };

  const parentOptionsFor = (level: HierarchyLevel) => {
    const parentLevel = PARENT_LEVEL[level];
    if (!parentLevel) return [];
    return nodes.filter(n => n.level === parentLevel);
  };

  const getManagerName = (managerId?: string) => {
    if (!managerId) return 'Unassigned';
    return managers.find(m => m.id === managerId)?.name || 'Unknown';
  };

  const nodeName = (id: string | null) => (id ? nodes.find((n) => n.id === id)?.name : undefined);
  const path = [nodeName(selectedZone), nodeName(selectedRegion), nodeName(selectedArea), nodeName(selectedTerritory)].filter(Boolean) as string[];

  const initialLoading = loading && nodes.length === 0;

  const renderNodes = (
    list: HierarchyNode[],
    selectedId: string | null,
    onSelect: (node: HierarchyNode) => void,
    drillable: boolean,
  ) => (
    <ul className="space-y-1.5">
      {list.map((node) => {
        const selected = selectedId === node.id;
        return (
          <li
            key={node.id}
            className={cn(
              'group flex items-center gap-1 rounded-lg border transition-colors',
              selected ? 'border-primary-300 bg-primary-50' : 'border-transparent hover:border-border hover:bg-surface-subtle',
            )}
          >
            <button
              type="button"
              onClick={() => onSelect(node)}
              aria-pressed={selected}
              className="min-w-0 flex-1 rounded-lg px-3 py-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <span className="block truncate text-sm font-medium text-gray-900">{node.name}</span>
              <span className="mt-0.5 flex items-center gap-1 text-xs text-foreground-subtle">
                <UsersIcon className="h-3 w-3 shrink-0" aria-hidden="true" />
                <span className="truncate">{getManagerName(node.managerId)}</span>
              </span>
            </button>
            <IconButton size="sm" aria-label={`Edit ${node.name}`} icon={<Pencil />} onClick={() => openEditModal(node)} />
            <IconButton
              size="sm"
              aria-label={`Delete ${node.name}`}
              icon={<Trash2 />}
              loading={deletingNodeId === node.id}
              onClick={() => setConfirmDeleteNode(node)}
              className="hover:text-danger-600"
            />
            {drillable && (
              <ChevronRight
                className={cn('mr-2 h-4 w-4 shrink-0', selected ? 'text-primary-600' : 'text-gray-400')}
                aria-hidden="true"
              />
            )}
          </li>
        );
      })}
    </ul>
  );

  const childEmpty = (label: string, parentLabel: string, level: HierarchyLevel, parentId: string) => (
    <EmptyState
      size="compact"
      icon={<MapPin />}
      title={`No ${label} yet`}
      description={`Add the first ${level.toLowerCase()} in this ${parentLabel}.`}
      action={<Button size="sm" variant="outline" leftIcon={<Plus />} onClick={() => openModalFor(level, parentId)}>Add {level.toLowerCase()}</Button>}
    />
  );

  const selectPrompt = (text: string) => (
    <p className="px-4 py-8 text-center text-sm text-foreground-subtle">{text}</p>
  );

  const parentLevel = PARENT_LEVEL[newNode.level];

  return (
    <PageSection>
      <PageHeader
        title="Organization hierarchy"
        description="Manage zones, regions, areas and territories, and who manages each."
        actions={
          <Button variant="accent" leftIcon={<Plus />} onClick={() => openModalFor('Zone', '')}>
            Add zone
          </Button>
        }
      />

      {errorMessage && (
        <Alert tone="danger" title="Couldn't delete" onDismiss={() => setErrorMessage('')}>
          {errorMessage}
        </Alert>
      )}

      {loadError && !initialLoading && nodes.length === 0 ? (
        <ErrorState title="Couldn't load the hierarchy" message={loadError} onRetry={fetchData} />
      ) : initialLoading ? (
        <LoadingRegion label="Loading hierarchy" className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-56 rounded-xl" />
          ))}
        </LoadingRegion>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-foreground-muted">
            <span className="tabular-nums">
              {levelCounts.Zone} zones · {levelCounts.Region} regions · {levelCounts.Area} areas · {levelCounts.Territory} territories
            </span>
            {path.length > 0 && (
              <nav aria-label="Selected path" className="flex min-w-0 flex-wrap items-center gap-1 text-gray-900">
                {path.map((p, i) => (
                  <span key={`${p}-${i}`} className="flex items-center gap-1">
                    {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />}
                    <span className={i === path.length - 1 ? 'font-medium' : ''}>{p}</span>
                  </span>
                ))}
              </nav>
            )}
          </div>

          {zones.length === 0 ? (
            <EmptyState
              bordered
              icon={<Network />}
              title="No zones yet"
              description="Start with a zone, then add regions, areas and territories under it. Territories are assigned to your reps."
              action={<Button leftIcon={<Plus />} onClick={() => openModalFor('Zone', '')}>Add zone</Button>}
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Column title="Zones" icon={<Map />} count={zones.length}>
                {renderNodes(
                  zones,
                  selectedZone,
                  (zone) => { setSelectedZone(zone.id); setSelectedRegion(null); setSelectedArea(null); setSelectedTerritory(null); },
                  true,
                )}
              </Column>

              <Column
                title="Regions"
                icon={<Map />}
                count={selectedZone ? regions.length : undefined}
                action={selectedZone && (
                  <IconButton size="sm" aria-label="Add region" icon={<Plus />} onClick={() => openModalFor('Region', selectedZone)} />
                )}
              >
                {!selectedZone
                  ? selectPrompt('Select a zone to see its regions')
                  : regions.length === 0
                    ? childEmpty('regions', 'zone', 'Region', selectedZone)
                    : renderNodes(
                        regions,
                        selectedRegion,
                        (region) => { setSelectedRegion(region.id); setSelectedArea(null); setSelectedTerritory(null); },
                        true,
                      )}
              </Column>

              <Column
                title="Areas"
                icon={<MapPin />}
                count={selectedRegion ? areas.length : undefined}
                action={selectedRegion && (
                  <IconButton size="sm" aria-label="Add area" icon={<Plus />} onClick={() => openModalFor('Area', selectedRegion)} />
                )}
              >
                {!selectedRegion
                  ? selectPrompt('Select a region to see its areas')
                  : areas.length === 0
                    ? childEmpty('areas', 'region', 'Area', selectedRegion)
                    : renderNodes(
                        areas,
                        selectedArea,
                        (area) => { setSelectedArea(area.id); setSelectedTerritory(null); },
                        true,
                      )}
              </Column>

              <Column
                title="Territories"
                icon={<MapPin />}
                count={selectedArea ? territories.length : undefined}
                action={selectedArea && (
                  <IconButton size="sm" aria-label="Add territory" icon={<Plus />} onClick={() => openModalFor('Territory', selectedArea)} />
                )}
              >
                {!selectedArea
                  ? selectPrompt('Select an area to see its territories')
                  : territories.length === 0
                    ? childEmpty('territories', 'area', 'Territory', selectedArea)
                    : renderNodes(territories, selectedTerritory, (t) => setSelectedTerritory(t.id), false)}
              </Column>
            </div>
          )}
        </>
      )}

      {/* Add / edit node */}
      <Modal
        open={showAddModal}
        onClose={closeModal}
        dismissible={!saving}
        title={editingNodeId ? `Edit ${newNode.level.toLowerCase()}` : `Add ${newNode.level.toLowerCase()}`}
        description={
          !editingNodeId && newNode.parentId
            ? `Under ${nodeName(newNode.parentId) ?? 'the selected ' + (parentLevel ?? '').toLowerCase()}`
            : undefined
        }
        footer={
          <>
            <Button variant="outline" onClick={closeModal} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" form="hierarchy-node-form" loading={saving}>
              {editingNodeId ? 'Save changes' : `Create ${newNode.level.toLowerCase()}`}
            </Button>
          </>
        }
      >
        <form id="hierarchy-node-form" onSubmit={onSubmitNode} noValidate className="space-y-3">
          {modalError && (
            <Alert tone="danger" onDismiss={() => setModalError('')}>
              {modalError}
            </Alert>
          )}
          <Input
            id="node-name"
            data-autofocus
            label={`${newNode.level} name`}
            required
            placeholder={`e.g. North ${newNode.level}`}
            value={newNode.name}
            onChange={(e) => {
              setNewNode({ ...newNode, name: e.target.value });
              if (nameError) setNameError('');
            }}
            error={nameError}
          />

          {editingNodeId && parentLevel && (
            <Select
              label={`Parent ${parentLevel.toLowerCase()}`}
              value={newNode.parentId}
              onChange={(e) => setNewNode({ ...newNode, parentId: e.target.value })}
              options={[
                { value: '', label: '— None —' },
                ...parentOptionsFor(newNode.level).map((p) => ({ value: p.id, label: p.name })),
              ]}
              helperText="Changing the parent moves this node and everything under it."
            />
          )}

          <Select
            label="Manager"
            optional
            value={newNode.managerId}
            onChange={(e) => setNewNode({ ...newNode, managerId: e.target.value })}
            options={[
              { value: '', label: '— Unassigned —' },
              ...managers.map((m) => ({ value: m.id, label: `${m.name} (${m.role})` })),
            ]}
            helperText="People in this node report to this manager."
          />
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmDeleteNode)}
        onClose={() => setConfirmDeleteNode(null)}
        tone="danger"
        title={`Delete ${confirmDeleteNode?.level.toLowerCase() ?? 'node'}?`}
        description={
          confirmDeleteNode
            ? `"${confirmDeleteNode.name}" will be permanently deleted. Nodes with children can't be deleted until they are moved or removed.`
            : undefined
        }
        confirmLabel={`Delete ${confirmDeleteNode?.level.toLowerCase() ?? ''}`.trim()}
        cancelLabel="Keep it"
        onConfirm={() => (confirmDeleteNode ? handleDeleteNode(confirmDeleteNode) : undefined)}
      />
    </PageSection>
  );
}
