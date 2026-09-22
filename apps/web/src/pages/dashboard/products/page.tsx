import { useState, useEffect } from 'react';
import {
  Button,
  DataTable,
  DataTableColumn,
  Drawer,
  EmptyState,
  Input,
  PageHeader,
  PageSection,
  SearchInput,
  Select,
  StatCard,
  StatGrid,
  StatusPill,
  Toolbar,
  cn,
  formatINR,
  formatNumber,
  formatPercent,
  useToast,
} from '@bharatsales/ui';
import { ProductsService } from '@bharatsales/api-client';
import { Product } from '@bharatsales/shared-types';
import { Package, Plus, CheckCircle2, AlertTriangle, PackageX, IndianRupee } from 'lucide-react';
import { ErrorState, getErrorMessage } from '../../../components/common/ErrorState';

const EMPTY_PRODUCT = {
  name: '', sku: '', brand: '', category: '', status: 'Active' as const, hsn: '',
  pricing: { mrp: 0, basePrice: 0, pts: 0, ptr: 0, gstPercentage: 0 },
  stock: { available: 0, uom: 'Piece', conversionFactor: 1 },
};

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-4">
      <legend className="mb-3 text-xs font-semibold uppercase tracking-wide text-foreground-subtle">{title}</legend>
      {children}
    </fieldset>
  );
}

export default function ProductsPage() {
  const toast = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [brandFilter, setBrandFilter] = useState('All Brands');
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ sku?: string; name?: string }>({});

  // API Create Payload uses basePrice, mrp, gstPercentage in pricing, and available, uom in stock.
  const [newProduct, setNewProduct] = useState(EMPTY_PRODUCT);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const data = await ProductsService.getProducts();
      setProducts(data || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setLoadError(getErrorMessage(error) ?? 'Failed to load products.');
    } finally {
      setLoading(false);
    }
  };

  // Category + brand filters here; text search (name / SKU / brand) is applied by the table.
  const filteredProducts = products.filter(product => {
    const matchesCategory = categoryFilter === 'All Categories' || product.category === categoryFilter;
    const matchesBrand = brandFilter === 'All Brands' || product.brand === brandFilter;
    return matchesCategory && matchesBrand;
  });

  // Compute unique categories and brands dynamically
  const uniqueCategories = ['All Categories', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];
  const uniqueBrands = ['All Brands', ...Array.from(new Set(products.map(p => p.brand).filter(Boolean)))];

  const handleAddProduct = async () => {
    const next: { sku?: string; name?: string } = {};
    if (!newProduct.sku.trim()) next.sku = 'Enter a SKU code';
    if (!newProduct.name.trim()) next.name = 'Enter the product name';
    setErrors(next);
    if (next.sku || next.name) {
      document.getElementById(next.sku ? 'product-sku' : 'product-name')?.focus();
      return;
    }
    if (newProduct.name && newProduct.sku) {
      setSaving(true);
      try {
        await ProductsService.createProduct(newProduct);
        toast.success(`Product "${newProduct.name}" added`);
        setShowAddModal(false);
        setNewProduct(EMPTY_PRODUCT);
        fetchProducts(); // Refresh list
      } catch (err) {
        console.error('Failed to create product', err);
        toast.error(getErrorMessage(err) ?? "Couldn't add the product. Try again.");
      } finally {
        setSaving(false);
      }
    }
  };

  const openAdd = () => {
    setErrors({});
    setShowAddModal(true);
  };

  const setPricing = (key: keyof typeof EMPTY_PRODUCT.pricing, value: string) =>
    setNewProduct(prev => ({ ...prev, pricing: { ...prev.pricing, [key]: Number(value) } }));

  const hasFilters = !!searchTerm || categoryFilter !== 'All Categories' || brandFilter !== 'All Brands';
  const clearFilters = () => { setSearchTerm(''); setCategoryFilter('All Categories'); setBrandFilter('All Brands'); };

  const lowStock = products.filter(p => (p.stock?.available || 0) > 0 && (p.stock?.available || 0) < 50).length;
  const outOfStock = products.filter(p => (p.stock?.available || 0) === 0).length;

  const columns: DataTableColumn<Product>[] = [
    {
      id: 'name', header: 'Product', accessor: (p) => `${p.name} ${p.sku}`, sortable: true, primary: true,
      sortFn: (a, b) => a.name.localeCompare(b.name, 'en-IN'),
      cell: (p) => (
        <div className="min-w-0">
          <div className="truncate font-medium text-gray-900">{p.name}</div>
          <div className="truncate font-mono text-xs text-foreground-subtle">{p.sku}</div>
        </div>
      ),
    },
    { id: 'brand', header: 'Brand', accessor: 'brand', sortable: true, hideBelow: 'md', cell: (p) => p.brand || '—' },
    { id: 'category', header: 'Category', accessor: 'category', sortable: true, hideBelow: 'lg', cell: (p) => p.category || '—' },
    { id: 'mrp', header: 'MRP', accessor: (p) => p.pricing?.mrp || 0, sortable: true, align: 'right', searchable: false, hideBelow: 'md',
      cell: (p) => <span className="tabular-nums text-gray-700">{formatINR(p.pricing?.mrp || 0)}</span> },
    { id: 'ptr', header: 'PTR', accessor: (p) => p.pricing?.ptr || 0, sortable: true, align: 'right', searchable: false,
      cell: (p) => <span className="font-medium tabular-nums text-gray-900">{formatINR(p.pricing?.ptr || 0)}</span> },
    { id: 'pts', header: 'PTS', accessor: (p) => p.pricing?.pts || 0, sortable: true, align: 'right', searchable: false, hideBelow: 'lg',
      cell: (p) => <span className="tabular-nums text-gray-900">{formatINR(p.pricing?.pts || 0)}</span> },
    { id: 'gst', header: 'GST', accessor: (p) => p.pricing?.gstPercentage || 0, sortable: true, align: 'right', searchable: false, hideBelow: 'lg',
      cell: (p) => <span className="tabular-nums">{formatPercent(p.pricing?.gstPercentage || 0, { decimals: 0 })}</span> },
    {
      id: 'stock', header: 'Stock', accessor: (p) => p.stock?.available || 0, sortable: true, align: 'right', searchable: false,
      cell: (p) => {
        const qty = p.stock?.available || 0;
        return (
          <span className={cn('tabular-nums', qty === 0 ? 'font-medium text-danger-700' : qty < 50 ? 'font-medium text-warning-700' : 'text-gray-700')}>
            {formatNumber(qty)} <span className="text-xs text-foreground-subtle">{p.stock?.uom || ''}</span>
          </span>
        );
      },
    },
    { id: 'status', header: 'Status', accessor: 'status', sortable: true, searchable: false, cell: (p) => <StatusPill status={p.status} /> },
  ];

  return (
    <PageSection>
      <PageHeader
        title="Products"
        description="Product master, pricing and inventory."
        actions={<Button variant="accent" leftIcon={<Plus />} onClick={openAdd}>Add product</Button>}
      />

      <StatGrid columns={4}>
        <StatCard label="Total SKUs" value={formatNumber(products.length)} icon={<Package />} loading={loading} />
        <StatCard label="Active" value={formatNumber(products.filter(p => p.status === 'Active').length)} icon={<CheckCircle2 />} tone="success" loading={loading} />
        <StatCard label="Low stock" value={formatNumber(lowStock)} icon={<AlertTriangle />} tone={lowStock > 0 ? 'warning' : 'neutral'} hint="Under 50 units" loading={loading} />
        <StatCard label="Out of stock" value={formatNumber(outOfStock)} icon={<PackageX />} tone={outOfStock > 0 ? 'danger' : 'neutral'} loading={loading} />
      </StatGrid>

      <DataTable
        caption="Products"
        itemLabel="products"
        data={filteredProducts}
        columns={columns}
        loading={loading}
        error={loadError && <ErrorState title="Couldn't load products" message={loadError} onRetry={fetchProducts} className="border-0" />}
        globalFilter={searchTerm}
        initialSort={{ id: 'name', direction: 'asc' }}
        mobileLayout="cards"
        emptyState={
          hasFilters ? (
            <EmptyState size="compact" title="No products match" description="Try a different search or clear the filters."
              action={<Button variant="outline" onClick={clearFilters}>Clear filters</Button>} />
          ) : (
            <EmptyState icon={<Package />} title="No products yet" description="Add your first SKU so reps can take orders against it."
              action={<Button leftIcon={<Plus />} onClick={openAdd}>Add product</Button>} />
          )
        }
        toolbar={
          <Toolbar>
            <SearchInput value={searchTerm} onValueChange={setSearchTerm} placeholder="Search name or SKU" aria-label="Search products" containerClassName="w-full sm:max-w-sm" />
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <Select hideLabel label="Category" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
                options={uniqueCategories.map(c => ({ value: c, label: c === 'All Categories' ? 'All categories' : c }))} />
              <Select hideLabel label="Brand" value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)}
                options={uniqueBrands.map(b => ({ value: b, label: b === 'All Brands' ? 'All brands' : b }))} />
            </div>
          </Toolbar>
        }
      />

      {/* Add Product */}
      <Drawer
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add product"
        description="New SKUs are available for ordering as soon as they're saved."
        size="lg"
        dismissible={!saving}
        footer={
          <>
            <Button variant="outline" onClick={() => setShowAddModal(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" form="add-product-form" loading={saving}>Add product</Button>
          </>
        }
      >
        <form id="add-product-form" noValidate onSubmit={(e) => { e.preventDefault(); handleAddProduct(); }} className="space-y-3">
          <FormSection title="Details">
            <div className="grid gap-3 sm:grid-cols-2">
              <Input id="product-sku" data-autofocus label="SKU" required placeholder="SKU-001" value={newProduct.sku} error={errors.sku}
                onChange={(e) => { setNewProduct({ ...newProduct, sku: e.target.value }); setErrors(p => ({ ...p, sku: undefined })); }} />
              <Input id="product-name" label="Name" required placeholder="Product name" value={newProduct.name} error={errors.name}
                onChange={(e) => { setNewProduct({ ...newProduct, name: e.target.value }); setErrors(p => ({ ...p, name: undefined })); }} />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Input label="Brand" placeholder="Brand name" value={newProduct.brand} onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })} />
              <Input label="Category" placeholder="Category" value={newProduct.category} onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })} />
              <Input label="HSN code" placeholder="HSN" inputMode="numeric" value={newProduct.hsn} onChange={(e) => setNewProduct({ ...newProduct, hsn: e.target.value })} />
            </div>
          </FormSection>

          <FormSection title="Pricing">
            <div className="grid gap-3 sm:grid-cols-2">
              <Input label="MRP" type="number" min={0} inputMode="decimal" leftIcon={<IndianRupee />} value={newProduct.pricing.mrp} onChange={(e) => setPricing('mrp', e.target.value)} />
              <Input label="Base price" type="number" min={0} inputMode="decimal" leftIcon={<IndianRupee />} value={newProduct.pricing.basePrice} onChange={(e) => setPricing('basePrice', e.target.value)} />
              <Input label="PTS" helperText="Price to stockist" type="number" min={0} inputMode="decimal" leftIcon={<IndianRupee />} value={newProduct.pricing.pts} onChange={(e) => setPricing('pts', e.target.value)} />
              <Input label="PTR" helperText="Price to retailer" type="number" min={0} inputMode="decimal" leftIcon={<IndianRupee />} value={newProduct.pricing.ptr} onChange={(e) => setPricing('ptr', e.target.value)} />
              <Input label="GST %" type="number" min={0} max={28} inputMode="decimal" placeholder="18" value={newProduct.pricing.gstPercentage} onChange={(e) => setPricing('gstPercentage', e.target.value)} />
            </div>
          </FormSection>

          <FormSection title="Stock">
            <div className="grid gap-3 sm:grid-cols-3">
              <Input label="Initial stock" type="number" min={0} inputMode="numeric" value={newProduct.stock.available}
                onChange={(e) => setNewProduct({ ...newProduct, stock: { ...newProduct.stock, available: Number(e.target.value) } })} />
              <Input label="Base UOM" placeholder="Piece" value={newProduct.stock.uom}
                onChange={(e) => setNewProduct({ ...newProduct, stock: { ...newProduct.stock, uom: e.target.value } })} />
              <Input label="Conversion factor" type="number" min={1} inputMode="numeric" value={newProduct.stock.conversionFactor}
                onChange={(e) => setNewProduct({ ...newProduct, stock: { ...newProduct.stock, conversionFactor: Number(e.target.value) } })} />
            </div>
          </FormSection>
        </form>
      </Drawer>
    </PageSection>
  );
}
