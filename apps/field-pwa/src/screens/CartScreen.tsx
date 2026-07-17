import { useState, useMemo } from 'react';
import { useCart } from '../contexts/CartContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../database/db';
import { Trash2, Plus, Minus, CheckCircle2, AlertTriangle, Tag } from 'lucide-react';
import type { Scheme } from '@bharatsales/shared-types';
import { VoiceOrderButton } from '../components/VoiceOrderButton';

export function CartScreen() {
  const { cart, updateQuantity, removeFromCart, clearCart } = useCart();
  const [selectedOutletId, setSelectedOutletId] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const outlets = useLiveQuery(() => db.outlets.toArray(), []) ?? [];
  const distributors = useLiveQuery(() => db.distributors.toArray(), []) ?? [];
  const schemes = useLiveQuery(() => db.schemes.where('isActive').equals('true').toArray(), []) ?? [];

  const selectedOutlet = outlets.find(o => o.id === selectedOutletId);
  const assignedDistributor = distributors.find(d => d.id === selectedOutlet?.commercial?.assignedDistributorId);

  // Advanced calculation engine
  const { orderItems, totals, appliedSchemes, creditExceeded } = useMemo(() => {
    let subTotal = 0;
    let discountTotal = 0;
    let cgstTotal = 0;
    let sgstTotal = 0;
    let igstTotal = 0;
    let grandTotal = 0;
    const items = [];
    const usedSchemes: Scheme[] = [];

    const isInterState = assignedDistributor && selectedOutlet && assignedDistributor.location.state !== selectedOutlet.location.state;

    // 1. Process cart items and apply schemes
    for (const cartItem of cart) {
      let unitPrice = cartItem.product.pricing.basePrice;
      let quantity = cartItem.quantity;
      let discount = 0;
      let appliedSchemeId = undefined;
      
      // Basic scheme evaluation
      for (const scheme of schemes) {
        const isApplicable = scheme.applicableProductIds.length === 0 || scheme.applicableProductIds.includes(cartItem.product.id);
        if (isApplicable && quantity >= scheme.minQuantity) {
          if (scheme.type === 'PERCENTAGE_DISCOUNT' && scheme.discountPercentage) {
            discount = (unitPrice * quantity) * (scheme.discountPercentage / 100);
            appliedSchemeId = scheme.id;
            if (!usedSchemes.find(s => s.id === scheme.id)) usedSchemes.push(scheme);
          }
          // Note: FREE_ITEM logic could push a new free item to `items` array
          // Skipping complex FREE_ITEM logic in UI for now, focusing on percentage discounts.
        }
      }

      const itemSubTotal = (unitPrice * quantity) - discount;
      const gstAmount = itemSubTotal * (cartItem.product.pricing.gstPercentage / 100);
      
      let cgstAmount = 0, sgstAmount = 0, igstAmount = 0;
      if (isInterState) {
        igstAmount = gstAmount;
      } else {
        cgstAmount = gstAmount / 2;
        sgstAmount = gstAmount / 2;
      }

      subTotal += itemSubTotal;
      discountTotal += discount;
      cgstTotal += cgstAmount;
      sgstTotal += sgstAmount;
      igstTotal += igstAmount;

      items.push({
        productId: cartItem.product.id,
        sku: cartItem.product.sku,
        name: cartItem.product.name,
        quantity,
        unitPrice,
        discount,
        appliedSchemeId,
        gstPercentage: cartItem.product.pricing.gstPercentage,
        cgstAmount,
        sgstAmount,
        igstAmount,
        subTotal: itemSubTotal,
        total: itemSubTotal + cgstAmount + sgstAmount + igstAmount,
      });
    }

    grandTotal = subTotal + cgstTotal + sgstTotal + igstTotal;
    
    const outstanding = selectedOutlet?.commercial?.outstandingBalance || 0;
    const limit = selectedOutlet?.commercial?.creditLimit || 0;
    const creditExceeded = selectedOutlet ? (outstanding + grandTotal > limit) : false;

    return {
      orderItems: items,
      totals: { subTotal, discountTotal, cgstTotal, sgstTotal, igstTotal, grandTotal },
      appliedSchemes: usedSchemes,
      creditExceeded
    };
  }, [cart, selectedOutlet, assignedDistributor, schemes]);

  const handleSubmitOrder = async () => {
    if (!selectedOutletId || cart.length === 0 || creditExceeded) return;

    const orderId = crypto.randomUUID();
    const orderPayload = {
      id: orderId,
      organizationId: selectedOutlet?.organizationId || 'org_unknown',
      idempotencyKey: crypto.randomUUID(),
      orderNumber: `ORD-${Math.floor(Math.random() * 100000)}`,
      outletId: selectedOutletId,
      assignedDistributorId: assignedDistributor?.id,
      createdByUserId: 'user_local',
      status: 'Draft',
      items: orderItems,
      totals,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.syncQueue.add({
      action: 'CREATE_ORDER',
      status: 'PENDING',
      createdAt: Date.now(),
      payload: orderPayload
    });

    setIsSubmitted(true);
    clearCart();
    setSelectedOutletId('');
    
    setTimeout(() => { setIsSubmitted(false); }, 3000);
  };

  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Order Placed!</h2>
        <p className="text-center text-gray-500">
          The order has been saved offline and will automatically sync.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 pb-24">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Review Order</h1>

      <VoiceOrderButton />

      {cart.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Cart is empty</h3>
          <p className="text-sm text-gray-500 mt-1">Add items from the catalog.</p>
        </div>
      ) : (
        <>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-2">
            <label className="text-sm font-semibold text-gray-700">Select Outlet *</label>
            <select 
              value={selectedOutletId}
              onChange={(e) => setSelectedOutletId(e.target.value)}
              className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-primary-500 focus:border-primary-500 bg-white"
            >
              <option value="">-- Choose Outlet --</option>
              {outlets.map(outlet => (
                <option key={outlet.id} value={outlet.id}>{outlet.name}</option>
              ))}
            </select>
            {selectedOutlet && (
              <div className="mt-2 text-xs text-gray-500 flex justify-between bg-gray-50 p-2 rounded">
                <span>Credit Limit: ₹{selectedOutlet.commercial.creditLimit}</span>
                <span>Outstanding: ₹{selectedOutlet.commercial.outstandingBalance}</span>
              </div>
            )}
          </div>

          {creditExceeded && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex gap-3 text-red-700">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="font-bold text-sm">Credit Limit Exceeded</p>
                <p className="text-xs mt-1">This order exceeds the outlet's available credit. Please reduce the order quantity or clear outstanding dues.</p>
              </div>
            </div>
          )}

          {appliedSchemes.length > 0 && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-green-800 text-sm flex gap-2">
              <Tag className="w-4 h-4 mt-0.5" />
              <div>
                <span className="font-bold">Schemes Applied:</span>
                <ul className="list-disc ml-4 mt-1 text-xs">
                  {appliedSchemes.map(s => <li key={s.id}>{s.name}</li>)}
                </ul>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
            {cart.map((item) => {
              const calcItem = orderItems.find(i => i.productId === item.product.id);
              return (
                <div key={item.product.id} className="p-4 flex flex-col gap-3">
                  <div className="flex justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900 text-sm">{item.product.name}</h4>
                      <div className="text-xs text-gray-500">₹{item.product.pricing.basePrice} / unit</div>
                      {calcItem?.discount ? (
                        <div className="text-xs text-green-600 font-medium mt-1">Discount: -₹{calcItem.discount.toFixed(2)}</div>
                      ) : null}
                    </div>
                    <div className="font-bold text-sm">₹{calcItem?.total.toFixed(2)}</div>
                  </div>
                  
                  <div className="flex items-center space-x-3 justify-end">
                    <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50">
                      <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="p-1.5 text-gray-600">
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="p-1.5 text-gray-600">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <button onClick={() => removeFromCart(item.product.id)} className="p-1.5 text-red-500 bg-red-50 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span>₹{totals.subTotal.toFixed(2)}</span>
            </div>
            {totals.discountTotal > 0 && (
              <div className="flex justify-between text-sm text-green-600 font-medium">
                <span>Total Discount</span>
                <span>-₹{totals.discountTotal.toFixed(2)}</span>
              </div>
            )}
            {totals.cgstTotal > 0 && (
              <div className="flex justify-between text-sm text-gray-500">
                <span>CGST</span>
                <span>₹{totals.cgstTotal.toFixed(2)}</span>
              </div>
            )}
            {totals.sgstTotal > 0 && (
              <div className="flex justify-between text-sm text-gray-500">
                <span>SGST</span>
                <span>₹{totals.sgstTotal.toFixed(2)}</span>
              </div>
            )}
            {totals.igstTotal > 0 && (
              <div className="flex justify-between text-sm text-gray-500">
                <span>IGST</span>
                <span>₹{totals.igstTotal.toFixed(2)}</span>
              </div>
            )}
            <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-gray-900 text-lg">
              <span>Grand Total</span>
              <span>₹{totals.grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <button 
            onClick={handleSubmitOrder}
            disabled={!selectedOutletId || cart.length === 0 || creditExceeded}
            className={`w-full py-3.5 rounded-xl text-white font-medium shadow-sm transition-colors ${
              !selectedOutletId || creditExceeded ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700 active:scale-[0.98]'
            }`}
          >
            {!selectedOutletId ? 'Select an Outlet to Order' : creditExceeded ? 'Credit Limit Exceeded' : 'Place Order Now'}
          </button>
        </>
      )}
    </div>
  );
}
