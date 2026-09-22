import { useState, useEffect } from 'react';
import {
  Alert,
  Badge,
  Button,
  Checkbox,
  ConfirmDialog,
  DataTable,
  DataTableColumn,
  DropdownMenu,
  EmptyState,
  IconButton,
  Input,
  Modal,
  PageHeader,
  PageSection,
  SearchInput,
  Select,
  StatusPill,
  TabPanel,
  Tabs,
  Toolbar,
  formatDate,
  formatINR,
  formatNumber,
  formatPercent,
  useToast,
} from '@bharatsales/ui';
import { SchemesService, TaxRatesService, PriceListsService } from '@bharatsales/api-client';
import type { Scheme, TaxRate, PriceList } from '@bharatsales/shared-types';
import { Plus, MoreHorizontal, Pencil, Trash2, BadgePercent, Receipt, ListOrdered, IndianRupee } from 'lucide-react';
import { useCurrentUser } from '../../../contexts/CurrentUserContext';
import { ErrorState, getErrorMessage } from '../../../components/common/ErrorState';

type Tab = 'schemes' | 'taxRates' | 'priceLists';

const EMPTY_SCHEME = {
  name: '', description: '', type: 'PERCENTAGE_DISCOUNT' as 'PERCENTAGE_DISCOUNT' | 'FREE_ITEM',
  isActive: true, minQuantity: 0, minOrderValue: 0, discountPercentage: '', freeProductId: '', freeQuantity: '',
  validFrom: '', validUntil: '',
};
const EMPTY_TAX_RATE = { name: '', percentage: '', country: 'India', region: '' };
const EMPTY_PRICE_LIST = { name: '', type: 'Customer' as 'Customer' | 'Customer Group', status: 'Active' as 'Active' | 'Inactive', validFrom: '', validTo: '' };

/** `<input type="date">` needs YYYY-MM-DD; stored values may be full ISO timestamps. Display-only. */
const toDateInput = (v: unknown) => (typeof v === 'string' ? v.slice(0, 10) : '');

type PendingDelete = { kind: Tab; id: string; name: string } | null;
type FieldErrors = Record<string, string | undefined>;

function RowActions({ label, onEdit, onDelete }: { label: string; onEdit: () => void; onDelete: () => void }) {
  return (
    <DropdownMenu
      trigger={(p) => <IconButton {...p} size="sm" aria-label={`Actions for ${label}`} icon={<MoreHorizontal />} />}
      items={[
        { label: 'Edit', icon: <Pencil className="h-4 w-4" />, onSelect: onEdit },
        { type: 'separator' },
        { label: 'Delete', icon: <Trash2 className="h-4 w-4" />, danger: true, onSelect: onDelete },
      ]}
    />
  );
}

export default function PricingPage() {
  const toast = useToast();
  const [tab, setTab] = useState<Tab>('schemes');
  const { role } = useCurrentUser();
  const [actionError, setActionError] = useState('');

  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [schemeForm, setSchemeForm] = useState<any>(null); // non-null while modal open; null = closed. Has `_id` when editing.
  const [taxRateForm, setTaxRateForm] = useState<any>(null);
  const [priceListForm, setPriceListForm] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null);

  const canManage = role === 'Organization Admin';

  const fetchAll = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const [s, t, p] = await Promise.all([
        SchemesService.getSchemes(),
        TaxRatesService.getTaxRates(),
        PriceListsService.getPriceLists(),
      ]);
      setSchemes(s || []);
      setTaxRates(t || []);
      setPriceLists(p || []);
    } catch (err) {
      console.error('Failed to fetch pricing data:', err);
      setLoadError(getErrorMessage(err) ?? 'Failed to load pricing data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const flash = (msg: string) => {
    toast.success(msg);
  };

  /** Shows inline errors and focuses the first invalid field. Returns true when valid. */
  const requireFields = (checks: [string, boolean, string][]) => {
    const next: FieldErrors = {};
    checks.forEach(([id, ok, msg]) => { if (!ok) next[id] = msg; });
    setFieldErrors(next);
    const first = Object.keys(next)[0];
    if (first) document.getElementById(first)?.focus();
    return !first;
  };

  const handleSaveScheme = async () => {
    if (!requireFields([
      ['scheme-name', !!schemeForm.name, 'Enter a scheme name'],
      ['scheme-from', !!schemeForm.validFrom, 'Choose a start date'],
      ['scheme-until', !!schemeForm.validUntil, 'Choose an end date'],
    ])) return;
    if (!schemeForm.name || !schemeForm.validFrom || !schemeForm.validUntil) return;
    setSaving(true);
    setActionError('');
    try {
      const payload = {
        name: schemeForm.name,
        description: schemeForm.description,
        type: schemeForm.type,
        isActive: schemeForm.isActive,
        applicableProductIds: [],
        minQuantity: Number(schemeForm.minQuantity) || 0,
        minOrderValue: Number(schemeForm.minOrderValue) || 0,
        discountPercentage: schemeForm.discountPercentage ? Number(schemeForm.discountPercentage) : undefined,
        freeProductId: schemeForm.freeProductId || undefined,
        freeQuantity: schemeForm.freeQuantity ? Number(schemeForm.freeQuantity) : undefined,
        validFrom: schemeForm.validFrom,
        validUntil: schemeForm.validUntil,
      };
      if (schemeForm._id) {
        await SchemesService.updateScheme(schemeForm._id, payload as any);
      } else {
        await SchemesService.createScheme(payload as any);
      }
      flash(`Scheme "${schemeForm.name}" saved`);
      setSchemeForm(null);
      fetchAll();
    } catch (err: any) {
      setActionError(err?.response?.data?.message || 'Failed to save scheme.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteScheme = async (id: string) => {
    try {
      await SchemesService.deleteScheme(id);
      flash('Scheme deleted');
      fetchAll();
    } catch (err: any) {
      setActionError(err?.response?.data?.message || 'Failed to delete scheme.');
    }
  };

  const handleSaveTaxRate = async () => {
    if (!requireFields([
      ['tax-name', !!taxRateForm.name, 'Enter a name, e.g. GST 18%'],
      ['tax-percentage', !!taxRateForm.percentage, 'Enter the tax percentage'],
      ['tax-country', !!taxRateForm.country, 'Enter the country'],
    ])) return;
    if (!taxRateForm.name || !taxRateForm.percentage || !taxRateForm.country) return;
    setSaving(true);
    setActionError('');
    try {
      const payload = {
        name: taxRateForm.name,
        percentage: Number(taxRateForm.percentage),
        country: taxRateForm.country,
        region: taxRateForm.region || undefined,
      };
      if (taxRateForm._id) {
        await TaxRatesService.updateTaxRate(taxRateForm._id, payload as any);
      } else {
        await TaxRatesService.createTaxRate(payload as any);
      }
      flash(`Tax rate "${taxRateForm.name}" saved`);
      setTaxRateForm(null);
      fetchAll();
    } catch (err: any) {
      setActionError(err?.response?.data?.message || 'Failed to save tax rate.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTaxRate = async (id: string) => {
    try {
      await TaxRatesService.deleteTaxRate(id);
      flash('Tax rate deleted');
      fetchAll();
    } catch (err: any) {
      setActionError(err?.response?.data?.message || 'Failed to delete tax rate.');
    }
  };

  const handleSavePriceList = async () => {
    if (!requireFields([
      ['pl-name', !!priceListForm.name, 'Enter a price list name'],
      ['pl-from', !!priceListForm.validFrom, 'Choose a start date'],
    ])) return;
    if (!priceListForm.name || !priceListForm.validFrom) return;
    setSaving(true);
    setActionError('');
    try {
      const payload = {
        name: priceListForm.name,
        type: priceListForm.type,
        status: priceListForm.status,
        validFrom: priceListForm.validFrom,
        validTo: priceListForm.validTo || undefined,
        pricingRules: priceListForm.pricingRules || {},
      };
      if (priceListForm._id) {
        await PriceListsService.updatePriceList(priceListForm._id, payload as any);
      } else {
        await PriceListsService.createPriceList(payload as any);
      }
      flash(`Price list "${priceListForm.name}" saved`);
      setPriceListForm(null);
      fetchAll();
    } catch (err: any) {
      setActionError(err?.response?.data?.message || 'Failed to save price list.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePriceList = async (id: string) => {
    try {
      await PriceListsService.deletePriceList(id);
      flash('Price list deleted');
      fetchAll();
    } catch (err: any) {
      setActionError(err?.response?.data?.message || 'Failed to delete price list.');
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    if (pendingDelete.kind === 'schemes') await handleDeleteScheme(pendingDelete.id);
    else if (pendingDelete.kind === 'taxRates') await handleDeleteTaxRate(pendingDelete.id);
    else await handleDeletePriceList(pendingDelete.id);
    setPendingDelete(null);
  };

  const openForm = (setter: (v: any) => void, value: any) => {
    setFieldErrors({});
    setActionError('');
    setter(value);
  };

  const clearErr = (id: string) => fieldErrors[id] && setFieldErrors((p) => ({ ...p, [id]: undefined }));

  const modalOpen = !!schemeForm || !!taxRateForm || !!priceListForm;
  const errorNode = loadError && <ErrorState title="Couldn't load pricing data" message={loadError} onRetry={fetchAll} className="border-0" />;

  // ---- Columns ----------------------------------------------------------

  const schemeColumns: DataTableColumn<any>[] = [
    {
      id: 'name', header: 'Scheme', accessor: (s) => `${s.name} ${s.description ?? ''}`, sortable: true, primary: true,
      sortFn: (a, b) => String(a.name).localeCompare(String(b.name), 'en-IN'),
      cell: (s) => (
        <div className="min-w-0">
          <div className="truncate font-medium text-gray-900">{s.name}</div>
          {s.description && <div className="line-clamp-1 text-xs text-foreground-subtle">{s.description}</div>}
        </div>
      ),
    },
    {
      id: 'benefit', header: 'Benefit', searchable: false,
      accessor: (s) => (s.type === 'PERCENTAGE_DISCOUNT' ? Number(s.discountPercentage) || 0 : Number(s.freeQuantity) || 0),
      cell: (s) => s.type === 'PERCENTAGE_DISCOUNT'
        ? <Badge tone="primary" size="sm">{formatPercent(Number(s.discountPercentage) || 0, { decimals: 1 })} off</Badge>
        : <Badge tone="accent" size="sm">{formatNumber(Number(s.freeQuantity) || 0)} free</Badge>,
    },
    {
      id: 'conditions', header: 'Conditions', searchable: false, hideBelow: 'md',
      cell: (s) => (
        <span className="text-sm text-gray-700">
          Min qty <span className="tabular-nums">{formatNumber(Number(s.minQuantity) || 0)}</span>
          {' · '}min order <span className="tabular-nums">{formatINR(Number(s.minOrderValue) || 0)}</span>
        </span>
      ),
    },
    {
      id: 'validity', header: 'Valid', accessor: 'validUntil', sortable: true, searchable: false, hideBelow: 'lg',
      cell: (s) => <span className="whitespace-nowrap text-sm text-gray-700">{formatDate(s.validFrom, 'medium', s.validFrom)} – {formatDate(s.validUntil, 'medium', s.validUntil)}</span>,
    },
    { id: 'status', header: 'Status', accessor: (s) => (s.isActive ? 'Active' : 'Inactive'), sortable: true, cell: (s) => <StatusPill status={s.isActive ? 'Active' : 'Inactive'} /> },
    ...(canManage ? [{
      id: 'actions', header: <span className="sr-only">Actions</span>, align: 'right' as const, width: 'w-12',
      cell: (s: any) => <RowActions label={s.name}
        onEdit={() => openForm(setSchemeForm, { ...s, _id: s.id })}
        onDelete={() => setPendingDelete({ kind: 'schemes', id: s.id, name: s.name })} />,
    }] : []),
  ];

  const taxColumns: DataTableColumn<any>[] = [
    { id: 'name', header: 'Name', accessor: 'name', sortable: true, primary: true, cell: (t) => <span className="font-medium text-gray-900">{t.name}</span> },
    { id: 'rate', header: 'Rate', accessor: (t) => Number(t.percentage) || 0, sortable: true, align: 'right', searchable: false,
      cell: (t) => <span className="font-medium tabular-nums">{formatPercent(Number(t.percentage) || 0, { decimals: 2 })}</span> },
    { id: 'country', header: 'Country', accessor: 'country', sortable: true },
    { id: 'region', header: 'Region', accessor: 'region', sortable: true, hideBelow: 'sm', cell: (t) => t.region || <span className="text-foreground-subtle">All regions</span> },
    ...(canManage ? [{
      id: 'actions', header: <span className="sr-only">Actions</span>, align: 'right' as const, width: 'w-12',
      cell: (t: any) => <RowActions label={t.name}
        onEdit={() => openForm(setTaxRateForm, { ...t, _id: t.id })}
        onDelete={() => setPendingDelete({ kind: 'taxRates', id: t.id, name: t.name })} />,
    }] : []),
  ];

  const priceListColumns: DataTableColumn<any>[] = [
    { id: 'name', header: 'Price list', accessor: 'name', sortable: true, primary: true, cell: (p) => <span className="font-medium text-gray-900">{p.name}</span> },
    { id: 'type', header: 'Applies to', accessor: 'type', sortable: true, hideBelow: 'sm' },
    {
      id: 'validity', header: 'Valid', accessor: 'validFrom', sortable: true, searchable: false,
      cell: (p) => (
        <span className="whitespace-nowrap text-sm text-gray-700">
          {formatDate(p.validFrom, 'medium', p.validFrom)}{p.validTo ? ` – ${formatDate(p.validTo, 'medium', p.validTo)}` : ' onwards'}
        </span>
      ),
    },
    { id: 'status', header: 'Status', accessor: 'status', sortable: true, cell: (p) => <StatusPill status={p.status} /> },
    ...(canManage ? [{
      id: 'actions', header: <span className="sr-only">Actions</span>, align: 'right' as const, width: 'w-12',
      cell: (p: any) => <RowActions label={p.name}
        onEdit={() => openForm(setPriceListForm, { ...p, _id: p.id })}
        onDelete={() => setPendingDelete({ kind: 'priceLists', id: p.id, name: p.name })} />,
    }] : []),
  ];

  // Header copy is the page's one saffron CTA; the empty-state copy stays blue.
  const renderNewButton = (variant: 'primary' | 'accent') =>
    !canManage ? undefined :
    tab === 'schemes' ? <Button variant={variant} leftIcon={<Plus />} onClick={() => openForm(setSchemeForm, { ...EMPTY_SCHEME })}>New scheme</Button> :
    tab === 'taxRates' ? <Button variant={variant} leftIcon={<Plus />} onClick={() => openForm(setTaxRateForm, { ...EMPTY_TAX_RATE })}>New tax rate</Button> :
    <Button variant={variant} leftIcon={<Plus />} onClick={() => openForm(setPriceListForm, { ...EMPTY_PRICE_LIST })}>New price list</Button>;
  const newButton = renderNewButton('primary');

  const toolbar = (placeholder: string) => (
    <Toolbar>
      <SearchInput value={search} onValueChange={setSearch} placeholder={placeholder} aria-label={placeholder} containerClassName="w-full sm:max-w-sm" />
    </Toolbar>
  );

  const empty = (icon: React.ReactNode, title: string, description: string) =>
    search ? undefined : <EmptyState icon={icon} title={title} description={description} action={newButton} />;

  const formAlert = actionError ? <Alert tone="danger" onDismiss={() => setActionError('')}>{actionError}</Alert> : null;

  return (
    <PageSection>
      <PageHeader
        title="Pricing & schemes"
        description="Manage discount schemes, tax rates and customer price lists."
        actions={renderNewButton('accent')}
      />

      {actionError && !modalOpen && (
        <Alert tone="danger" title="Something went wrong" onDismiss={() => setActionError('')}>{actionError}</Alert>
      )}

      <div>
        <Tabs
          id="pricing"
          aria-label="Pricing sections"
          value={tab}
          onValueChange={(v) => { setTab(v as Tab); setSearch(''); }}
          items={[
            { value: 'schemes', label: 'Schemes', count: loading ? undefined : schemes.length },
            { value: 'taxRates', label: 'Tax rates', count: loading ? undefined : taxRates.length },
            { value: 'priceLists', label: 'Price lists', count: loading ? undefined : priceLists.length },
          ]}
        />
        <div className="mt-4">
          <TabPanel tabsId="pricing" value="schemes" active={tab === 'schemes'}>
            <DataTable
              caption="Discount schemes"
              itemLabel="schemes"
              data={schemes as any[]}
              columns={schemeColumns}
              loading={loading}
              error={errorNode}
              globalFilter={search}
              initialSort={{ id: 'name', direction: 'asc' }}
              mobileLayout="cards"
              toolbar={toolbar('Search schemes')}
              emptyState={empty(<BadgePercent />, 'No schemes yet', canManage ? 'Create a discount or free-item scheme to boost orders.' : 'Schemes set up by your admin will appear here.')}
            />
          </TabPanel>
          <TabPanel tabsId="pricing" value="taxRates" active={tab === 'taxRates'}>
            <DataTable
              caption="Tax rates"
              itemLabel="tax rates"
              data={taxRates as any[]}
              columns={taxColumns}
              loading={loading}
              error={errorNode}
              globalFilter={search}
              initialSort={{ id: 'rate', direction: 'asc' }}
              mobileLayout="cards"
              toolbar={toolbar('Search tax rates')}
              emptyState={empty(<Receipt />, 'No tax rates yet', canManage ? 'Add your GST slabs so invoices calculate tax correctly.' : 'Tax rates set up by your admin will appear here.')}
            />
          </TabPanel>
          <TabPanel tabsId="pricing" value="priceLists" active={tab === 'priceLists'}>
            <DataTable
              caption="Price lists"
              itemLabel="price lists"
              data={priceLists as any[]}
              columns={priceListColumns}
              loading={loading}
              error={errorNode}
              globalFilter={search}
              initialSort={{ id: 'name', direction: 'asc' }}
              mobileLayout="cards"
              toolbar={toolbar('Search price lists')}
              emptyState={empty(<ListOrdered />, 'No price lists yet', canManage ? 'Create a price list for a customer or customer group.' : 'Price lists set up by your admin will appear here.')}
            />
          </TabPanel>
        </div>
      </div>

      {/* Scheme */}
      <Modal
        open={!!schemeForm}
        onClose={() => setSchemeForm(null)}
        title={schemeForm?._id ? 'Edit scheme' : 'New scheme'}
        size="lg"
        dismissible={!saving}
        footer={
          <>
            <Button variant="outline" onClick={() => setSchemeForm(null)} disabled={saving}>Cancel</Button>
            <Button type="submit" form="scheme-form" loading={saving}>{schemeForm?._id ? 'Save scheme' : 'Create scheme'}</Button>
          </>
        }
      >
        {schemeForm && (
          <form id="scheme-form" noValidate onSubmit={(e) => { e.preventDefault(); handleSaveScheme(); }} className="space-y-4">
            {formAlert}
            <Input id="scheme-name" data-autofocus label="Name" required value={schemeForm.name} error={fieldErrors['scheme-name']}
              onChange={e => { setSchemeForm({ ...schemeForm, name: e.target.value }); clearErr('scheme-name'); }} />
            <Input label="Description" optional value={schemeForm.description} onChange={e => setSchemeForm({ ...schemeForm, description: e.target.value })} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Select label="Type" value={schemeForm.type} onChange={e => setSchemeForm({ ...schemeForm, type: e.target.value })}
                options={[{ value: 'PERCENTAGE_DISCOUNT', label: 'Percentage discount' }, { value: 'FREE_ITEM', label: 'Free item' }]} />
              {schemeForm.type === 'PERCENTAGE_DISCOUNT' && (
                <Input label="Discount %" type="number" min={0} max={100} inputMode="decimal" value={schemeForm.discountPercentage}
                  onChange={e => setSchemeForm({ ...schemeForm, discountPercentage: e.target.value })} />
              )}
            </div>
            {schemeForm.type !== 'PERCENTAGE_DISCOUNT' && (
              <div className="grid gap-3 sm:grid-cols-2">
                <Input label="Free product ID" value={schemeForm.freeProductId} onChange={e => setSchemeForm({ ...schemeForm, freeProductId: e.target.value })} />
                <Input label="Free quantity" type="number" min={0} inputMode="numeric" value={schemeForm.freeQuantity} onChange={e => setSchemeForm({ ...schemeForm, freeQuantity: e.target.value })} />
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <Input label="Min quantity" type="number" min={0} inputMode="numeric" value={schemeForm.minQuantity} onChange={e => setSchemeForm({ ...schemeForm, minQuantity: e.target.value })} />
              <Input label="Min order value" type="number" min={0} inputMode="decimal" leftIcon={<IndianRupee />} value={schemeForm.minOrderValue} onChange={e => setSchemeForm({ ...schemeForm, minOrderValue: e.target.value })} />
              <Input id="scheme-from" label="Valid from" required type="date" value={toDateInput(schemeForm.validFrom)} error={fieldErrors['scheme-from']}
                onChange={e => { setSchemeForm({ ...schemeForm, validFrom: e.target.value }); clearErr('scheme-from'); }} />
              <Input id="scheme-until" label="Valid until" required type="date" value={toDateInput(schemeForm.validUntil)} error={fieldErrors['scheme-until']}
                onChange={e => { setSchemeForm({ ...schemeForm, validUntil: e.target.value }); clearErr('scheme-until'); }} />
            </div>
            <Checkbox label="Active" description="Reps can apply this scheme on new orders" checked={schemeForm.isActive}
              onChange={e => setSchemeForm({ ...schemeForm, isActive: e.target.checked })} />
          </form>
        )}
      </Modal>

      {/* Tax rate */}
      <Modal
        open={!!taxRateForm}
        onClose={() => setTaxRateForm(null)}
        title={taxRateForm?._id ? 'Edit tax rate' : 'New tax rate'}
        size="sm"
        dismissible={!saving}
        footer={
          <>
            <Button variant="outline" onClick={() => setTaxRateForm(null)} disabled={saving}>Cancel</Button>
            <Button type="submit" form="tax-form" loading={saving}>{taxRateForm?._id ? 'Save tax rate' : 'Create tax rate'}</Button>
          </>
        }
      >
        {taxRateForm && (
          <form id="tax-form" noValidate onSubmit={(e) => { e.preventDefault(); handleSaveTaxRate(); }} className="space-y-4">
            {formAlert}
            <Input id="tax-name" data-autofocus label="Name" required placeholder="e.g. GST 18%" value={taxRateForm.name} error={fieldErrors['tax-name']}
              onChange={e => { setTaxRateForm({ ...taxRateForm, name: e.target.value }); clearErr('tax-name'); }} />
            <Input id="tax-percentage" label="Percentage" required type="number" min={0} inputMode="decimal" value={taxRateForm.percentage} error={fieldErrors['tax-percentage']}
              onChange={e => { setTaxRateForm({ ...taxRateForm, percentage: e.target.value }); clearErr('tax-percentage'); }} />
            <Input id="tax-country" label="Country" required value={taxRateForm.country} error={fieldErrors['tax-country']}
              onChange={e => { setTaxRateForm({ ...taxRateForm, country: e.target.value }); clearErr('tax-country'); }} />
            <Input label="Region" optional helperText="Leave blank to apply everywhere" value={taxRateForm.region} onChange={e => setTaxRateForm({ ...taxRateForm, region: e.target.value })} />
          </form>
        )}
      </Modal>

      {/* Price list */}
      <Modal
        open={!!priceListForm}
        onClose={() => setPriceListForm(null)}
        title={priceListForm?._id ? 'Edit price list' : 'New price list'}
        size="md"
        dismissible={!saving}
        footer={
          <>
            <Button variant="outline" onClick={() => setPriceListForm(null)} disabled={saving}>Cancel</Button>
            <Button type="submit" form="price-list-form" loading={saving}>{priceListForm?._id ? 'Save price list' : 'Create price list'}</Button>
          </>
        }
      >
        {priceListForm && (
          <form id="price-list-form" noValidate onSubmit={(e) => { e.preventDefault(); handleSavePriceList(); }} className="space-y-4">
            {formAlert}
            <Input id="pl-name" data-autofocus label="Name" required value={priceListForm.name} error={fieldErrors['pl-name']}
              onChange={e => { setPriceListForm({ ...priceListForm, name: e.target.value }); clearErr('pl-name'); }} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Select label="Type" value={priceListForm.type} onChange={e => setPriceListForm({ ...priceListForm, type: e.target.value })}
                options={[{ value: 'Customer', label: 'Customer' }, { value: 'Customer Group', label: 'Customer group' }]} />
              <Select label="Status" value={priceListForm.status} onChange={e => setPriceListForm({ ...priceListForm, status: e.target.value })}
                options={[{ value: 'Active', label: 'Active' }, { value: 'Inactive', label: 'Inactive' }]} />
              <Input id="pl-from" label="Valid from" required type="date" value={toDateInput(priceListForm.validFrom)} error={fieldErrors['pl-from']}
                onChange={e => { setPriceListForm({ ...priceListForm, validFrom: e.target.value }); clearErr('pl-from'); }} />
              <Input label="Valid to" optional type="date" value={toDateInput(priceListForm.validTo)} onChange={e => setPriceListForm({ ...priceListForm, validTo: e.target.value })} />
            </div>
          </form>
        )}
      </Modal>

      <ConfirmDialog
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        tone="danger"
        title={`Delete ${pendingDelete?.kind === 'schemes' ? 'scheme' : pendingDelete?.kind === 'taxRates' ? 'tax rate' : 'price list'}?`}
        description={<><span className="font-medium text-gray-900">{pendingDelete?.name}</span> will be removed. This can't be undone.</>}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
      />
    </PageSection>
  );
}
