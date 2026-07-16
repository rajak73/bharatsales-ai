'use client';

import { useState, useEffect } from 'react';
import { ProductsService } from '@bharatsales/api-client';
import { Product } from '@bharatsales/shared-types';
import { Loader2 } from 'lucide-react';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [brandFilter, setBrandFilter] = useState('All Brands');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // API Create Payload uses basePrice, mrp, gstPercentage in pricing, and available, uom in stock.
  const [newProduct, setNewProduct] = useState({ 
    name: '', sku: '', brand: '', category: '', status: 'Active' as const, hsn: '',
    pricing: { mrp: 0, basePrice: 0, pts: 0, ptr: 0, gstPercentage: 0 },
    stock: { available: 0, uom: 'Piece', conversionFactor: 1 }
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await ProductsService.getProducts();
      setProducts(data || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All Categories' || product.category === categoryFilter;
    const matchesBrand = brandFilter === 'All Brands' || product.brand === brandFilter;
    return matchesSearch && matchesCategory && matchesBrand;
  });

  // Pagination
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleAddProduct = async () => {
    if (newProduct.name && newProduct.sku) {
      try {
        await ProductsService.createProduct(newProduct);
        setSuccessMessage(`Product "${newProduct.name}" added successfully!`);
        setShowAddModal(false);
        setNewProduct({ 
          name: '', sku: '', brand: '', category: '', status: 'Active', hsn: '',
          pricing: { mrp: 0, basePrice: 0, pts: 0, ptr: 0, gstPercentage: 0 },
          stock: { available: 0, uom: 'Piece', conversionFactor: 1 }
        });
        fetchProducts(); // Refresh list
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (err) {
        console.error('Failed to create product', err);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-green-600">✅</span>
            <span className="text-sm text-green-800 font-medium">{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage('')} className="text-green-600 hover:text-green-800">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500">Product master, pricing & inventory • {filteredProducts.length} products found</p>
        </div>
        <div className="flex space-x-3">
          <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">📥 Import</button>
          <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">📤 Export</button>
          <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">+ Add Product</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-center">
          <div className="text-2xl font-bold text-gray-900">{products.length}</div>
          <div className="text-sm text-gray-500">Total SKUs</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-center">
          <div className="text-2xl font-bold text-green-600">{products.filter(p => p.status === 'Active').length}</div>
          <div className="text-sm text-gray-500">Active</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-center">
          <div className="text-2xl font-bold text-yellow-600">{products.filter(p => p.stock.available > 0 && p.stock.available < 50).length}</div>
          <div className="text-sm text-gray-500">Low Stock</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-center">
          <div className="text-2xl font-bold text-red-600">{products.filter(p => p.stock.available === 0).length}</div>
          <div className="text-sm text-gray-500">Out of Stock</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex flex-wrap gap-4">
          <input
            type="text"
            placeholder="Search products..."
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm w-64"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
          <select
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm w-40"
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
          >
            <option>All Categories</option>
            <option>Detergent</option>
            <option>Oral Care</option>
            <option>Biscuits</option>
            <option>Personal Care</option>
            <option>Dairy</option>
            <option>Beverages</option>
          </select>
          <select
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm w-40"
            value={brandFilter}
            onChange={(e) => { setBrandFilter(e.target.value); setCurrentPage(1); }}
          >
            <option>All Brands</option>
            <option>HUL</option>
            <option>Colgate</option>
            <option>Parle</option>
            <option>Tata</option>
            <option>Amul</option>
          </select>
          {(searchTerm || categoryFilter !== 'All Categories' || brandFilter !== 'All Brands') && (
            <button
              onClick={() => { setSearchTerm(''); setCategoryFilter('All Categories'); setBrandFilter('All Brands'); setCurrentPage(1); }}
              className="px-4 py-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-gray-500">
                <th className="px-6 py-4 font-medium">SKU</th>
                <th className="px-6 py-4 font-medium">Product</th>
                <th className="px-6 py-4 font-medium">Brand</th>
                <th className="px-6 py-4 font-medium">Category</th>
                <th className="px-6 py-4 font-medium">MRP</th>
                <th className="px-6 py-4 font-medium">PTR</th>
                <th className="px-6 py-4 font-medium">PTS</th>
                <th className="px-6 py-4 font-medium">GST %</th>
                <th className="px-6 py-4 font-medium">Stock</th>
                <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                 <tr>
                    <td colSpan={9} className="px-6 py-12 text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto" />
                    </td>
                </tr>
              ) : paginatedProducts.length > 0 ? (
                paginatedProducts.map((p) => (
                  <tr key={p.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-primary-600">{p.sku}</td>
                    <td className="px-6 py-4 text-gray-900 font-medium">{p.name}</td>
                    <td className="px-6 py-4 text-gray-600">{p.brand}</td>
                    <td className="px-6 py-4 text-gray-600">{p.category}</td>
                    <td className="px-6 py-4 text-gray-600">₹{p.pricing.mrp}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">₹{p.pricing.ptr}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">₹{p.pricing.pts}</td>
                    <td className="px-6 py-4 text-gray-600">{p.pricing.gstPercentage}%</td>
                    <td className="px-6 py-4 text-gray-600">{p.stock.available} {p.stock.uom}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                        p.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <div className="text-gray-400">
                      <div className="text-4xl mb-2">📦</div>
                      <p className="text-sm">No products found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Add New Product</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SKU *</label>
                  <input
                    type="text"
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm w-full"
                    placeholder="SKU-001"
                    value={newProduct.sku}
                    onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm w-full"
                    placeholder="Product name"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                  <input
                    type="text"
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm w-full"
                    placeholder="Brand name"
                    value={newProduct.brand}
                    onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <input
                    type="text"
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm w-full"
                    placeholder="Category"
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">HSN Code</label>
                  <input
                    type="text"
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm w-full"
                    placeholder="HSN"
                    value={newProduct.hsn}
                    onChange={(e) => setNewProduct({ ...newProduct, hsn: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">MRP</label>
                  <input
                    type="number"
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm w-full"
                    placeholder="0"
                    value={newProduct.pricing.mrp}
                    onChange={(e) => setNewProduct({ ...newProduct, pricing: { ...newProduct.pricing, mrp: Number(e.target.value) } })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Base Price *</label>
                  <input
                    type="number"
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm w-full"
                    placeholder="0"
                    value={newProduct.pricing.basePrice}
                    onChange={(e) => setNewProduct({ ...newProduct, pricing: { ...newProduct.pricing, basePrice: Number(e.target.value) } })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PTS (To Stockist)</label>
                  <input
                    type="number"
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm w-full"
                    placeholder="0"
                    value={newProduct.pricing.pts}
                    onChange={(e) => setNewProduct({ ...newProduct, pricing: { ...newProduct.pricing, pts: Number(e.target.value) } })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PTR (To Retailer)</label>
                  <input
                    type="number"
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm w-full"
                    placeholder="0"
                    value={newProduct.pricing.ptr}
                    onChange={(e) => setNewProduct({ ...newProduct, pricing: { ...newProduct.pricing, ptr: Number(e.target.value) } })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GST %</label>
                  <input
                    type="number"
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm w-full"
                    placeholder="18"
                    value={newProduct.pricing.gstPercentage}
                    onChange={(e) => setNewProduct({ ...newProduct, pricing: { ...newProduct.pricing, gstPercentage: Number(e.target.value) } })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                 <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Initial Stock</label>
                  <input
                    type="number"
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm w-full"
                    placeholder="0"
                    value={newProduct.stock.available}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: { ...newProduct.stock, available: Number(e.target.value) } })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Base UOM</label>
                  <input
                    type="text"
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm w-full"
                    placeholder="Piece"
                    value={newProduct.stock.uom}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: { ...newProduct.stock, uom: e.target.value } })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Conv. Factor</label>
                  <input
                    type="number"
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm w-full"
                    placeholder="1"
                    value={newProduct.stock.conversionFactor}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: { ...newProduct.stock, conversionFactor: Number(e.target.value) } })}
                  />
                </div>
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={handleAddProduct}
                disabled={!newProduct.name || !newProduct.sku}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
