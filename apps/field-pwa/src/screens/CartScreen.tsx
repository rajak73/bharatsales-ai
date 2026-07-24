import { useState, useMemo } from 'react';
import { useCart } from '../contexts/CartContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../database/db';
import { Trash2, Plus, Minus, CheckCircle2, ChevronLeft, Search, ArrowRight, Image as ImageIcon } from 'lucide-react';
import type { Scheme } from '@bharatsales/shared-types';
import { useNavigate } from 'react-router-dom';

const EMPTY_OUTLETS: any[] = [];
const EMPTY_DISTRIBUTORS: any[] = [];
const EMPTY_SCHEMES: any[] = [];

export function CartScreen() {
  const { cart, updateQuantity, clearCart } = useCart();
  const [selectedOutletId, setSelectedOutletId] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const navigate = useNavigate();
  
  const outlets = useLiveQuery(() => db.outlets.toArray(), []) ?? EMPTY_OUTLETS;
  const distributors = useLiveQuery(() => db.distributors.toArray(), []) ?? EMPTY_DISTRIBUTORS;
  const schemes = useLiveQuery(() => db.schemes.where('isActive').equals('true').toArray(), []) ?? EMPTY_SCHEMES;

  // Default to first outlet if none selected (for testing UI, should normally let user pick)
  const currentOutletId = selectedOutletId || (outlets.length > 0 ? outlets[0].id : '');
  const selectedOutlet = outlets.find(o => o.id === currentOutletId);
  const assignedDistributor = distributors.find(d => d.id === selectedOutlet?.commercial?.assignedDistributorId);

  // Advanced calculation engine
  const { orderItems, totals, creditExceeded } = useMemo(() => {
    let subTotal = 0;
    let discountTotal = 0;
    let cgstTotal = 0;
    let sgstTotal = 0;
    let igstTotal = 0;
    let grandTotal = 0;
    const items = [];
    const usedSchemes: Scheme[] = [];

    const isInterState = assignedDistributor && selectedOutlet && assignedDistributor.location.state !== selectedOutlet.location.state;
    const deliveryCharges = 80.00; // Mocking delivery charges as per screenshot

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

      subTotal += (unitPrice * quantity);
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

    const totalBeforeTax = subTotal + deliveryCharges - discountTotal;
    grandTotal = totalBeforeTax + cgstTotal + sgstTotal + igstTotal;
    
    const outstanding = selectedOutlet?.commercial?.outstandingBalance || 0;
    const limit = selectedOutlet?.commercial?.creditLimit || 0;
    const creditExceeded = selectedOutlet ? (outstanding + grandTotal > limit) : false;

    return {
      orderItems: items,
      totals: { subTotal, deliveryCharges, totalBeforeTax, discountTotal, cgstTotal, sgstTotal, igstTotal, grandTotal },
      appliedSchemes: usedSchemes,
      creditExceeded
    };
  }, [cart, selectedOutlet, assignedDistributor, schemes]);

  const handleSubmitOrder = async () => {
    if (!currentOutletId || cart.length === 0 || creditExceeded) return;

    const orderId = crypto.randomUUID();
    const orderPayload = {
      id: orderId,
      organizationId: selectedOutlet?.organizationId || 'org_unknown',
      idempotencyKey: crypto.randomUUID(),
      orderNumber: `ORD-${Math.floor(Math.random() * 100000)}`,
      outletId: currentOutletId,
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
    
    setTimeout(() => { setIsSubmitted(false); navigate('/outlets'); }, 3000);
  };

  const formatCurrency = (amount: number) => {
    return '₹' + amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl flex flex-col items-center max-w-sm w-full text-center">
          <CheckCircle2 className="w-20 h-20 text-green-500 mb-6" />
          <h2 className="text-2xl font-bold text-[#1E293B] mb-2">Order Placed!</h2>
          <p className="text-[#64748B] mb-6">
            The order has been saved offline and will automatically sync when connected.
          </p>
          <button onClick={() => navigate('/outlets')} className="w-full py-3 bg-[#2D3A8C] text-white rounded-xl font-bold">
            Back to Outlets
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen font-sans flex flex-col relative pb-32">
      
      {/* Top Header */}
      <div className="bg-white px-4 py-4 flex items-center justify-between sticky top-0 z-50">
        <button onClick={() => navigate(-1)} className="p-2 text-[#1E293B]">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-lg font-bold text-[#1E293B]">Order Booking</h1>
        <button className="p-2 text-[#1E293B]">
          <Search size={20} />
        </button>
      </div>

      <div className="flex-1 px-4 py-2 space-y-4">
        {cart.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm mt-4">
            <h3 className="text-sm font-bold text-[#1E293B]">Cart is empty</h3>
            <p className="text-sm text-[#64748B] mt-1">Add items from the catalog to book an order.</p>
            <button onClick={() => navigate('/catalog')} className="mt-4 px-6 py-2 bg-[#2D3A8C] text-white rounded-lg text-sm font-bold">
              Browse Catalog
            </button>
          </div>
        ) : (
          <>
            {/* Outlet Selection (Hidden if already selected in real flow, keeping minimal) */}
            {!selectedOutletId && outlets.length > 1 && (
               <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <select 
                  value={selectedOutletId}
                  onChange={(e) => setSelectedOutletId(e.target.value)}
                  className="w-full text-sm text-[#1E293B] font-medium outline-none bg-transparent"
                >
                  <option value="">Select Outlet</option>
                  {outlets.map(outlet => (
                    <option key={outlet.id} value={outlet.id}>{outlet.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Cart Items List */}
            <div className="space-y-3">
              {cart.map((item) => {
                const calcItem = orderItems.find(i => i.productId === item.product.id);
                return (
                  <div key={item.product.id} className="bg-white p-4 rounded-2xl shadow-sm flex items-start gap-4">
                    
                    {/* Placeholder Image */}
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center shrink-0 border border-gray-200">
                       <ImageIcon className="text-gray-300 w-8 h-8" />
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-between h-16">
                      <div>
                        <h4 className="font-bold text-[#1E293B] text-sm leading-tight truncate">{item.product.name}</h4>
                        <p className="text-xs text-[#64748B] mt-0.5">{item.product.sku}</p>
                      </div>
                      <div className="font-bold text-[#1E293B] text-sm">
                        {formatCurrency(item.product.pricing.basePrice)}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end justify-between h-16">
                      <div className="flex items-center bg-[#F1F5F9] rounded-lg p-0.5">
                        <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="p-1 text-[#64748B] hover:text-[#1E293B]">
                          {item.quantity === 1 ? <Trash2 size={16} className="text-red-500" /> : <Minus size={16} />}
                        </button>
                        <span className="w-8 text-center text-sm font-bold text-[#1E293B]">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="p-1 bg-[#2D3A8C] text-white rounded-md shadow-sm">
                          <Plus size={16} />
                        </button>
                      </div>
                      <div className="font-bold text-[#1E293B] text-sm mt-1">
                        {formatCurrency(calcItem?.total || 0)}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Order Summary */}
            <div className="bg-[#F8FAFC] rounded-3xl p-5 border border-gray-100 shadow-sm mt-6">
              <h3 className="font-bold text-[#1E293B] text-base mb-4">Order Summary</h3>
              
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-[#64748B] font-medium">Subtotal ({cart.length} Items)</span>
                  <span className="text-[#1E293B] font-bold">{formatCurrency(totals.subTotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#64748B] font-medium">Delivery Charges</span>
                  <span className="text-[#1E293B] font-bold">{formatCurrency(totals.deliveryCharges)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#64748B] font-medium">Discount</span>
                  <span className="text-[#1E293B] font-bold">- {formatCurrency(totals.discountTotal)}</span>
                </div>
              </div>

              <div className="flex justify-between text-sm border-t border-gray-200 pt-3 mb-6">
                <span className="text-[#1E293B] font-bold">Total Before Tax</span>
                <span className="text-[#1E293B] font-bold">{formatCurrency(totals.totalBeforeTax)}</span>
              </div>

              <h3 className="font-bold text-[#1E293B] text-base mb-4">Tax Summary</h3>
              
              <div className="space-y-3 mb-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#64748B] font-medium">CGST (9.0%)</span>
                  <span className="text-[#1E293B] font-bold">{formatCurrency(totals.cgstTotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#64748B] font-medium">SGST (9.0%)</span>
                  <span className="text-[#1E293B] font-bold">{formatCurrency(totals.sgstTotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#64748B] font-medium">Integrated GST (0%)</span>
                  <span className="text-[#1E293B] font-bold">{formatCurrency(totals.igstTotal)}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Bottom Sticky Action Bar */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 w-full bg-white px-5 py-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] border-t border-gray-100 z-50">
          <div className="max-w-sm mx-auto flex items-center justify-between">
            <div>
              <p className="text-xs text-[#64748B] font-medium uppercase tracking-wider mb-0.5">Total Amount</p>
              <p className="text-xl font-bold text-[#1E293B]">{formatCurrency(totals.grandTotal)}</p>
            </div>
            <button 
              onClick={handleSubmitOrder}
              disabled={!currentOutletId || creditExceeded}
              className={`flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-white shadow-md transition-all ${
                !currentOutletId || creditExceeded ? 'bg-gray-400' : 'bg-[#007AFF] hover:bg-blue-600 active:scale-[0.98]'
              }`}
            >
              Place Order <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

