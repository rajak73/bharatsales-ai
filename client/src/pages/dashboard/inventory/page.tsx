import { useState, useEffect, useCallback, useMemo } from 'react';
import { InventoryService, ProductsService } from '@bharatsales/api-client';
import { Inventory } from '@bharatsales/shared-types';
import {
  Alert,
  Badge,
  Button,
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
  Textarea,
  Toolbar,
  formatDate,
  formatNumber,
  useToast,
} from '@bharatsales/ui';
import { AlertTriangle, Boxes, CalendarClock, Lock, Package, PackageCheck, PackageX, SlidersHorizontal } from 'lucide-react';
import { ErrorState, getErrorMessage } from '../../../components/common/ErrorState';

const LOW_STOCK_THRESHOLD = 20;

function isExpiringSoon(expiry?: string): boolean {
  if (!expiry) return false;
  const date = new Date(expiry);
  if (isNaN(date.getTime())) return false;
  const daysUntilExpiry = (date.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return daysUntilExpiry >= 0 && daysUntilExpiry <= 30;
}

const displayExpiry = (expiry?: string) => {
  if (!expiry) return '—';
  return isNaN(new Date(expiry).getTime()) ? expiry : formatDate(expiry);
};

const ADJUSTMENT_TYPES = ['Purchase', 'Damage', 'Expiry', 'Correction (Positive)', 'Correction (Negative)', 'Transfer In', 'Transfer Out'];
// Types that can bring a brand-new batch into stock (the API requires an expiry for these).
const NEW_BATCH_TYPES = ['Purchase', 'Transfer In'];
const NEW_BATCH = '__new__';
const EMPTY_ADJUSTMENT = { product: '', batch: '', type: '', quantity: '', reason: '', newBatch: '', expiry: '' };

export default function InventoryPage() {
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('All Warehouses');
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [newAdjustment, setNewAdjustment] = useState(EMPTY_ADJUSTMENT);
  const [allInventory, setAllInventory] = useState<Inventory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [adjustmentError, setAdjustmentError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  // Whole catalogue, so stock can be received for a product that has no batch yet.
  const [catalog, setCatalog] = useState<{ id: string; name: string; sku: string }[]>([]);

  const fetchInventory = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      const data = await InventoryService.getInventory();
      setAllInventory(data);
    } catch (error) {
      console.error('Failed to fetch inventory', error);
      setLoadError(getErrorMessage(error) ?? 'Failed to load inventory.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // Filter inventory
  const filteredInventory = allInventory.filter((item) => {
    const matchesSearch =
      item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.batch.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesWarehouse = warehouseFilter === 'All Warehouses' || item.warehouseId === warehouseFilter;
    return matchesSearch && matchesWarehouse;
  });

  const warehouseOptions = useMemo(() => {
    const ids = Array.from(new Set(['WH-01', 'WH-02', ...allInventory.map((i) => i.warehouseId).filter(Boolean)])) as string[];
    return [{ value: 'All Warehouses', label: 'All warehouses' }, ...ids.sort().map((id) => ({ value: id, label: id }))];
  }, [allInventory]);

  const productOptions = useMemo(() => {
    const seen = new Set<string>();
    const fromStock = allInventory
      .filter((i) => (seen.has(i.productId) ? false : (seen.add(i.productId), true)))
      .map((i) => ({ value: i.productId, label: `${i.productName} (${i.sku})` }));
    const fromCatalog = catalog
      .filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true)))
      .map((p) => ({ value: p.id, label: `${p.name} (${p.sku})` }));
    return [...fromStock, ...fromCatalog];
  }, [allInventory, catalog]);

  const batchOptions = useMemo(() => {
    const seen = new Set<string>();
    return allInventory
      .filter((i) => !newAdjustment.product || i.productId === newAdjustment.product)
      .filter((i) => (seen.has(i.batch) ? false : (seen.add(i.batch), true)))
      .map((i) => ({ value: i.batch, label: i.batch }))
      .concat([{ value: NEW_BATCH, label: '+ New batch…' }]);
  }, [allInventory, newAdjustment.product]);

  const isNewBatch = newAdjustment.batch === NEW_BATCH;
  const batchValue = isNewBatch ? newAdjustment.newBatch.trim() : newAdjustment.batch;

  const handleAdjustment = async () => {
    if (canSubmit) {
      setAdjustmentError('');
      setIsSaving(true);
      try {
        await InventoryService.adjustStock({
          productId: newAdjustment.product,
          batch: batchValue,
          type: newAdjustment.type,
          quantity: parseInt(newAdjustment.quantity, 10),
          reason: newAdjustment.reason,
          ...(isNewBatch && newAdjustment.expiry ? { expiry: newAdjustment.expiry } : {}),
        });

        // Refresh inventory from server
        const data = await InventoryService.getInventory();
        setAllInventory(data);

        const productName =
          allInventory.find((i) => i.productId === newAdjustment.product)?.productName ??
          catalog.find((p) => p.id === newAdjustment.product)?.name ??
          newAdjustment.product;
        toast.success(`Stock adjustment of ${newAdjustment.quantity} units for ${productName} recorded`);
        setShowAdjustmentModal(false);
        setNewAdjustment(EMPTY_ADJUSTMENT);
      } catch (error: unknown) {
        console.error('Failed to adjust inventory', error);
        setAdjustmentError(getErrorMessage(error) || 'Failed to adjust stock. Please check quantities.');
      } finally {
        setIsSaving(false);
      }
    }
  };

  const openAdjustment = (preset = EMPTY_ADJUSTMENT) => {
    setAdjustmentError('');
    if (catalog.length === 0) {
      ProductsService.getProducts()
        .then((products) => setCatalog((products || []).filter((p) => p.id).map((p) => ({ id: String(p.id), name: p.name, sku: p.sku }))))
        .catch(() => {
          /* catalogue is optional: existing batches can still be adjusted */
        });
    }
    setNewAdjustment(preset);
    setShowAdjustmentModal(true);
  };

  const expiringCount = allInventory.filter((i) => isExpiringSoon(i.expiry)).length;
  const lowStockCount = allInventory.filter((i) => (i.stock || 0) <= LOW_STOCK_THRESHOLD).length;
  const initialLoad = isLoading && allInventory.length === 0;
  const filtersActive = !!searchTerm || warehouseFilter !== 'All Warehouses';
  const canSubmit = !!(
    newAdjustment.product &&
    batchValue &&
    newAdjustment.type &&
    newAdjustment.quantity &&
    (!isNewBatch || (NEW_BATCH_TYPES.includes(newAdjustment.type) && newAdjustment.expiry))
  );

  const columns: DataTableColumn<Inventory>[] = [
    {
      id: 'product',
      header: 'Product',
      accessor: 'productName',
      sortable: true,
      primary: true,
      cell: (i) => (
        <div className="min-w-0">
          <p className="font-medium text-gray-900">{i.productName}</p>
          <p className="text-xs text-foreground-subtle">{i.sku}</p>
        </div>
      ),
    },
    { id: 'batch', header: 'Batch', accessor: 'batch', sortable: true, cell: (i) => <span className="text-gray-700">{i.batch}</span> },
    {
      id: 'expiry',
      header: 'Expiry',
      accessor: 'expiry',
      sortable: true,
      searchable: false,
      cell: (i) =>
        isExpiringSoon(i.expiry) ? (
          <Badge size="sm" tone="warning" icon={<CalendarClock />}>
            {displayExpiry(i.expiry)}
          </Badge>
        ) : (
          <span className="text-foreground-muted">{displayExpiry(i.expiry)}</span>
        ),
    },
    {
      id: 'onHand',
      header: 'On hand',
      accessor: (i) => (i.stock || 0) + (i.reservedStock || 0),
      align: 'right',
      sortable: true,
      searchable: false,
      hideBelow: 'md',
      cell: (i) => <span className="font-medium tabular-nums text-gray-900">{formatNumber((i.stock || 0) + (i.reservedStock || 0))}</span>,
    },
    {
      id: 'reserved',
      header: 'Reserved',
      accessor: (i) => i.reservedStock || 0,
      align: 'right',
      sortable: true,
      searchable: false,
      hideBelow: 'lg',
      cell: (i) => <span className="tabular-nums text-foreground-muted">{formatNumber(i.reservedStock || 0)}</span>,
    },
    {
      id: 'available',
      header: 'Available',
      accessor: (i) => i.stock || 0,
      align: 'right',
      sortable: true,
      searchable: false,
      cell: (i) => {
        const low = (i.stock || 0) <= LOW_STOCK_THRESHOLD;
        return (
          <span className={low ? 'inline-flex items-center gap-1 font-semibold tabular-nums text-warning-700' : 'font-semibold tabular-nums text-gray-900'}>
            {low && <AlertTriangle className="h-3.5 w-3.5" aria-label="Low stock" />}
            {formatNumber(i.stock || 0)}
          </span>
        );
      },
    },
    {
      id: 'blocked',
      header: 'Blocked',
      accessor: (i) => (i.blocked ? i.stock || 0 : 0),
      align: 'right',
      searchable: false,
      hideBelow: 'lg',
      cell: (i) =>
        i.blocked ? (
          <span className="font-medium tabular-nums text-danger-700">{formatNumber(i.stock || 0)}</span>
        ) : (
          <span className="tabular-nums text-foreground-subtle">0</span>
        ),
    },
    {
      id: 'warehouse',
      header: 'Warehouse',
      accessor: 'warehouseId',
      hideBelow: 'md',
      cell: (i) => <span className="text-foreground-muted">{i.warehouseId || '—'}</span>,
    },
    {
      id: 'actions',
      header: <span className="sr-only">Actions</span>,
      align: 'right',
      cell: (i) => (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => openAdjustment({ ...EMPTY_ADJUSTMENT, product: i.productId, batch: i.batch })}
          aria-label={`Adjust stock for ${i.productName}, batch ${i.batch}`}
        >
          Adjust
        </Button>
      ),
    },
  ];

  return (
    <PageSection>
      <PageHeader
        title="Inventory"
        description={`Stock overview, batches and movements · ${formatNumber(filteredInventory.length)} items`}
        actions={
          <Button variant="accent" leftIcon={<SlidersHorizontal />} onClick={() => openAdjustment()}>
            New adjustment
          </Button>
        }
      />

      <StatGrid columns={4}>
        <StatCard
          label="Total on hand"
          value={formatNumber(allInventory.reduce((sum, i) => sum + (i.stock || 0) + (i.reservedStock || 0), 0))}
          icon={<Boxes />}
          loading={initialLoad}
        />
        <StatCard
          label="Reserved"
          value={formatNumber(allInventory.reduce((sum, i) => sum + (i.reservedStock || 0), 0))}
          icon={<Lock />}
          tone="info"
          loading={initialLoad}
        />
        <StatCard
          label="Available"
          value={formatNumber(allInventory.reduce((sum, i) => sum + (i.stock || 0), 0))}
          icon={<PackageCheck />}
          tone="success"
          loading={initialLoad}
        />
        <StatCard label="Expiring soon" value={formatNumber(expiringCount)} hint="Within 30 days" icon={<CalendarClock />} tone="warning" loading={initialLoad} />
      </StatGrid>

      {(expiringCount > 0 || lowStockCount > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          {expiringCount > 0 && (
            <Alert tone="danger" title="Expiry alert">
              {formatNumber(expiringCount)} batch(es) expiring within 30 days. Push these first or plan a return.
            </Alert>
          )}
          {lowStockCount > 0 && (
            <Alert tone="warning" title="Low stock">
              {formatNumber(lowStockCount)} batch(es) at or below {LOW_STOCK_THRESHOLD} units available.
            </Alert>
          )}
        </div>
      )}

      <DataTable
        caption="Inventory by batch"
        itemLabel="batches"
        data={filteredInventory}
        columns={columns}
        getRowId={(i) => String(i.id)}
        loading={initialLoad}
        error={loadError ? <ErrorState title="Couldn't load inventory" message={loadError} onRetry={fetchInventory} className="border-0" /> : undefined}
        initialSort={{ id: 'expiry', direction: 'asc' }}
        mobileLayout="cards"
        toolbar={
          <Toolbar>
            <SearchInput
              value={searchTerm}
              onValueChange={setSearchTerm}
              placeholder="Search product, SKU or batch"
              aria-label="Search inventory"
              containerClassName="w-full sm:max-w-sm"
            />
            <div className="flex w-full items-center gap-2 sm:w-auto">
              <Select
                hideLabel
                label="Warehouse"
                options={warehouseOptions}
                value={warehouseFilter}
                onChange={(e) => setWarehouseFilter(e.target.value)}
                containerClassName="w-full sm:w-44"
              />
              {filtersActive && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSearchTerm('');
                    setWarehouseFilter('All Warehouses');
                  }}
                >
                  Clear
                </Button>
              )}
            </div>
          </Toolbar>
        }
        emptyState={
          filtersActive ? (
            <EmptyState
              icon={<PackageX />}
              title="No items match"
              description="Try a different product, SKU, batch or warehouse."
              action={
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setWarehouseFilter('All Warehouses');
                  }}
                >
                  Clear filters
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={<Package />}
              title="No inventory yet"
              description="Stock appears here once goods are received into a warehouse."
            />
          )
        }
      />

      {/* Adjustment Modal */}
      <Modal
        open={showAdjustmentModal}
        onClose={() => setShowAdjustmentModal(false)}
        dismissible={!isSaving}
        title="Stock adjustment"
        description="Receive new stock, or record damage, expiry, corrections or transfers for one batch."
        footer={
          <>
            <Button variant="outline" onClick={() => setShowAdjustmentModal(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" form="adjustment-form" loading={isSaving} disabled={!canSubmit}>
              Save adjustment
            </Button>
          </>
        }
      >
        <form
          id="adjustment-form"
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            handleAdjustment();
          }}
        >
          {adjustmentError && (
            <Alert tone="danger" onDismiss={() => setAdjustmentError('')}>
              {adjustmentError}
            </Alert>
          )}
          <Select
            label="Product"
            required
            placeholder="Select product"
            options={productOptions}
            value={newAdjustment.product}
            onChange={(e) => setNewAdjustment({ ...newAdjustment, product: e.target.value, batch: '' })}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              label="Batch"
              required
              placeholder="Select batch"
              options={batchOptions}
              value={newAdjustment.batch}
              onChange={(e) => setNewAdjustment({ ...newAdjustment, batch: e.target.value })}
            />
            <Select
              label="Type"
              required
              placeholder="Select type"
              options={ADJUSTMENT_TYPES.map((t) => ({ value: t, label: t }))}
              value={newAdjustment.type}
              onChange={(e) => setNewAdjustment({ ...newAdjustment, type: e.target.value })}
            />
          </div>
          {isNewBatch && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="New batch number"
                required
                placeholder="e.g. B-2026-10"
                value={newAdjustment.newBatch}
                onChange={(e) => setNewAdjustment({ ...newAdjustment, newBatch: e.target.value })}
              />
              <Input
                label="Expiry date"
                required
                type="date"
                value={newAdjustment.expiry}
                onChange={(e) => setNewAdjustment({ ...newAdjustment, expiry: e.target.value })}
                error={
                  newAdjustment.type && !NEW_BATCH_TYPES.includes(newAdjustment.type)
                    ? 'A new batch can only be added with Purchase or Transfer In'
                    : undefined
                }
              />
            </div>
          )}
          <Input
            label="Quantity"
            required
            type="number"
            inputMode="numeric"
            placeholder="Enter quantity"
            value={newAdjustment.quantity}
            onChange={(e) => setNewAdjustment({ ...newAdjustment, quantity: e.target.value })}
          />
          <Textarea
            label="Reason"
            optional
            rows={2}
            placeholder="Why is this stock being adjusted?"
            value={newAdjustment.reason}
            onChange={(e) => setNewAdjustment({ ...newAdjustment, reason: e.target.value })}
          />
        </form>
      </Modal>
    </PageSection>
  );
}
