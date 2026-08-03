import { create } from 'zustand';
import type { Product } from '@bharatsales/shared-types';
import type { CartItem } from '../features/rep/orderCalc';

interface CartState {
  cart: CartItem[];
  outletId: string | null;
  setOutlet: (outletId: string) => void;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: [],
  outletId: null,
  setOutlet: (outletId) => set({ outletId }),
  addToCart: (product) => {
    const existing = get().cart.find((i) => i.product.id === product.id);
    if (existing) {
      set({ cart: get().cart.map((i) => (i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)) });
    } else {
      set({ cart: [...get().cart, { product, quantity: 1 }] });
    }
  },
  removeFromCart: (productId) => set({ cart: get().cart.filter((i) => i.product.id !== productId) }),
  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeFromCart(productId);
      return;
    }
    set({ cart: get().cart.map((i) => (i.product.id === productId ? { ...i, quantity } : i)) });
  },
  clearCart: () => set({ cart: [], outletId: null }),
}));
