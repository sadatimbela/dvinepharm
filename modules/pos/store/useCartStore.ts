import { create } from 'zustand';
import { supabase } from '@/utils/supabase';
import { db } from '@/utils/db';

export interface CartItem {
  id: string; // product_id
  name: string;
  price: number;
  quantity: number;
  barcode: string;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
  processSale: (userId: string, totalAmount: number) => Promise<boolean>;
  total: number;
  lastSale: any | null;
  resetLastSale: () => void;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  lastSale: null,
  resetLastSale: () => set({ lastSale: null }),
  addItem: (product) => {
    const { items } = get();
    const existingIndex = items.findIndex((i) => i.id === product.id);
    let newItems;

    if (existingIndex > -1) {
      newItems = items.map((i, idx) =>
        idx === existingIndex ? { ...i, quantity: i.quantity + 1 } : i
      );
    } else {
      newItems = [...items, { ...product, quantity: 1 }];
    }
    set({ items: newItems, total: newItems.reduce((sum, item) => sum + item.price * item.quantity, 0) });
  },
  removeItem: (id) => {
    const newItems = get().items.filter((i) => i.id !== id);
    set({ items: newItems, total: newItems.reduce((sum, item) => sum + item.price * item.quantity, 0) });
  },
  updateQuantity: (id, delta) => {
    const newItems = get().items
      .map((i) => (i.id === id ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i))
      .filter((i) => i.quantity > 0);
    set({ items: newItems, total: newItems.reduce((sum, item) => sum + item.price * item.quantity, 0) });
  },
  clearCart: () => set({ items: [], total: 0 }),
  total: 0,
  processSale: async (userId, totalAmount) => {
    const { items } = get();
    if (items.length === 0) return false;

    try {
      // Create a sale object that includes readable names for the receipt
      const saleRecord = {
        id: crypto.randomUUID(),
        customer_name: 'Patient', // default
        timestamp: new Date().toISOString(),
        items: items.map(i => ({
          name: i.name,
          quantity: i.quantity,
          price: i.price,
          subtotal: i.price * i.quantity
        })),
        total_amount: Math.round(totalAmount)
      };

      // Background Sales Sync (Offline Architecture)
      const localSale = {
        localId: saleRecord.id,
        seller_id: userId,
        total_amount: saleRecord.total_amount,
        synced: false,
        created_at: new Date().toISOString(),
        items: items.map(i => ({
          product_id: i.id,
          quantity: i.quantity,
          unit_price: Math.round(i.price)
        }))
      };

      await db.sales.add(localSale);

      set({ lastSale: saleRecord });
      get().clearCart();
      return true;
    } catch (err) {
      console.error('Sale processing error:', err);
      return false;
    }
  }
}));
