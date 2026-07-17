import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../database/db';
import { Search, ShoppingCart, Plus, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { AiFeaturesService } from '@bharatsales/api-client';
import type { Product } from '@bharatsales/shared-types';

export function CatalogScreen() {
  const { state } = useLocation();
  const outletId = state?.outletId;
  const [search, setSearch] = useState('');
  const [isDictating, setIsDictating] = useState(false);
  const [dictationText, setDictationText] = useState('');
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const { addToCart, totalItems, cart } = useCart();
  
  const products = useLiveQuery(
    () => db.products.toArray(),
    []
  ) ?? [];

  useEffect(() => {
    if (outletId) {
      AiFeaturesService.getRecommendations(outletId)
        .then(data => setRecommendations(data))
        .catch(err => console.error('Failed to load AI recommendations', err));
    }
  }, [outletId]);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddToCart = (product: Product) => {
    addToCart(product);
  };

  const getQuantityInCart = (productId: string) => {
    const item = cart.find(c => c.product.id === productId);
    return item ? item.quantity : 0;
  };

  const handleDictation = async () => {
    if (isDictating) {
      setIsDictating(false);
      if (dictationText) {
        try {
          const parsedItems = await AiFeaturesService.parseVoice(dictationText);
          parsedItems.forEach((item: any) => {
            // Find product matching name
            const product = products.find(p => p.name.toLowerCase().includes(item.productName.toLowerCase()));
            if (product) {
              for(let i = 0; i < item.quantity; i++) {
                addToCart(product as any);
              }
            }
          });
        } catch (error) {
          console.error("Failed to parse voice command", error);
        }
      }
      setDictationText('');
    } else {
      setIsDictating(true);
      // Simulate listening
      setTimeout(() => {
        setDictationText('Add 50 Premium Chai');
      }, 1000);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-2xl font-bold text-gray-900">Catalog</h1>
        <div className="bg-primary-100 text-primary-800 p-2 rounded-full relative">
          <ShoppingCart className="w-5 h-5" />
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {totalItems}
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-2 mb-2">
        <button 
          onClick={handleDictation}
          className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl shadow-sm text-sm font-bold transition-all ${isDictating ? 'bg-red-50 text-red-600 border border-red-200 animate-pulse' : 'bg-purple-50 text-purple-700 border border-purple-100 hover:bg-purple-100'}`}
        >
          🎤 {isDictating ? (dictationText || 'Listening...') : 'Dictate AI Order'}
        </button>
      </div>

      {recommendations.length > 0 && !search && (
        <div className="mb-4">
          <h2 className="text-sm font-bold text-gray-900 flex items-center gap-1 mb-2">
            <Sparkles className="w-4 h-4 text-purple-600" /> AI Recommended
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
            {recommendations.map(rec => {
              const product = products.find(p => p.name.toLowerCase().includes(rec.productName.toLowerCase()) || p.id === rec.productId);
              if (!product) return null;
              const qty = getQuantityInCart(product.id);
              
              return (
                <div key={rec.productId} className="min-w-[160px] bg-gradient-to-br from-purple-50 to-indigo-50 p-3 rounded-xl border border-purple-100 snap-start flex flex-col">
                  <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-1 line-clamp-2">{product.name}</h3>
                  <p className="text-[10px] text-purple-700 font-medium leading-tight mb-2 line-clamp-2">{rec.reasoning}</p>
                  <div className="flex justify-between items-end mt-auto">
                    <div className="font-bold text-gray-900 text-sm">₹{product.pricing.basePrice}</div>
                    {qty > 0 ? (
                      <button onClick={() => addToCart(product as any)} className="bg-purple-200 text-purple-800 p-1 rounded-lg flex items-center"><span className="text-xs font-bold mr-1">{qty}</span><Plus className="w-3 h-3" /></button>
                    ) : (
                      <button onClick={() => addToCart(product as any)} className="bg-purple-600 text-white p-1 rounded-lg hover:bg-purple-700 active:scale-95 transition-all"><Plus className="w-4 h-4" /></button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search products & SKUs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 w-full rounded-xl border-gray-200 focus:border-primary-500 focus:ring-primary-500 text-sm h-10 border bg-white shadow-sm"
        />
      </div>

      {products.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
          <ShoppingCart className="mx-auto h-12 w-12 text-gray-300 mb-2" />
          <h3 className="text-sm font-semibold text-gray-900">No products found</h3>
          <p className="text-sm text-gray-500">Your local database has not synced the catalog yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filteredProducts.map((product) => {
            const qty = getQuantityInCart(product.id);
            return (
              <div key={product.id} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex flex-col h-full">
                <div className="flex-1">
                  <div className="text-[10px] text-gray-400 font-medium mb-1">{product.sku}</div>
                  <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-2 line-clamp-2">{product.name}</h3>
                  <div className="text-[11px] text-gray-500 mb-3">{product.category} • {product.brand}</div>
                </div>
                
                <div className="flex justify-between items-end mt-auto">
                  <div>
                    <div className="text-xs text-gray-400 line-through">₹{product.pricing.mrp}</div>
                    <div className="font-bold text-gray-900">₹{product.pricing.basePrice}</div>
                  </div>
                  
                  {qty > 0 ? (
                    <button 
                      onClick={() => handleAddToCart(product as any)}
                      className="bg-green-100 text-green-700 p-1.5 rounded-lg flex items-center shadow-sm"
                    >
                      <span className="text-xs font-bold mr-1">{qty}</span>
                      <Plus className="w-3 h-3" />
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleAddToCart(product as any)}
                      className="bg-primary-600 text-white p-1.5 rounded-lg hover:bg-primary-700 active:scale-95 transition-all shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
