import { create } from 'zustand';
import { supabase } from '@/utils/supabase';

export type StockStatus = 'In Stock' | 'Low Stock' | 'Out of Stock';

export interface InventoryItem {
  id: string;
  name: string;
  sku: string; // barcode
  stock: number;
  reorderLevel: number;
  expiry: string;
  category: string;
  status: StockStatus;
  price: number;
  costPrice: number;
}

interface InventoryStore {
  items: InventoryItem[];
  isLoading: boolean;
  fetchInventory: (retryCount?: number) => Promise<void>;
  updateItem: (id: string, data: Partial<InventoryItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
}

export const useInventoryStore = create<InventoryStore>((set) => ({
  items: [],
  isLoading: false,
  fetchInventory: async (retryCount = 0) => {
    set({ isLoading: true });
    
    // Using direct join as inventory_view is missing in the database
    const { data, error } = await supabase
      .from('products')
      .select('*, inventory(stock_qty, reorder_level, expiry_date)')
      .order('name', { ascending: true });

    // Handle Gotrue-js lock contention steal (race condition on concurrent token refresh)
    if (error && error.message.includes('another request stole it') && retryCount < 3) {
      setTimeout(() => useInventoryStore.getState().fetchInventory(retryCount + 1), 150 + Math.random() * 200);
      return;
    }

    if (!error && data) {
      set({
        items: data.map((d: any) => {
          const totalStock = d.inventory?.reduce((sum: number, item: any) => sum + (item.stock_qty || 0), 0) || 0;
          const reorder     = d.inventory?.[0]?.reorder_level || 20;
          const expiryVal   = d.inventory?.[0]?.expiry_date || 'N/A';
          const currentStatus = totalStock <= 0 ? 'Out of Stock' : (totalStock <= reorder ? 'Low Stock' : 'In Stock');

          return {
            id: d.id,
            name: d.name,
            sku: d.barcode || 'N/A',
            stock: totalStock,
            reorderLevel: reorder,
            expiry: expiryVal,
            category: 'General',
            status: currentStatus as StockStatus,
            price: d.base_price || 0,
            costPrice: 0 // cost_price is not stored in the products table
          };
        }),
        isLoading: false
      });
    } else {
      console.error('Inventory fetch error:', error);
      set({ isLoading: false });
    }
  },

  updateItem: async (id, data) => {
    // 1. Update Product table (including price)
    const { error: pErr } = await supabase
      .from('products')
      .update({
        name: data.name,
        barcode: data.sku,
        base_price: data.price, // Ensure price is updated
      })
      .eq('id', id);

    if (pErr) {
      console.error('Product update error:', pErr);
      throw new Error(`Product update failed: ${pErr.message}`);
    }

    // 2. Manage Inventory record (Upsert logic)
    const { data: existingInv } = await supabase
      .from('inventory')
      .select('id')
      .eq('product_id', id)
      .limit(1)
      .maybeSingle();

    if (existingInv) {
      // Update existing record
      const { error: iErr } = await supabase
        .from('inventory')
        .update({
          reorder_level: data.reorderLevel,
          expiry_date: data.expiry === 'N/A' ? null : data.expiry,
          stock_qty: data.stock
        })
        .eq('id', existingInv.id);

      if (iErr) throw iErr;
    } else {
      // Create new record if missing
      const { error: iErr } = await supabase
        .from('inventory')
        .insert([{
          product_id: id,
          stock_qty: data.stock,
          reorder_level: data.reorderLevel || 20,
          expiry_date: data.expiry === 'N/A' ? null : data.expiry,
        }]);

      if (iErr) throw iErr;
    }

    // Refresh local state
    await useInventoryStore.getState().fetchInventory();
  },

  deleteItem: async (id) => {
    // Cascading delete handles inventory records automatically
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
    
    // Refresh
    useInventoryStore.getState().fetchInventory();
  }
}));

export function getStatus(item: InventoryItem): StockStatus {
  return item.status;
}
