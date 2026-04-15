import { create } from 'zustand';
import { supabase } from '@/utils/supabase';
import { db } from '@/utils/db';

export interface Product {
  id: string;
  name: string;
  barcode: string;
  price: number;
  cost_price: number;
  category: string;
  stock: number;
}

interface ProductStore {
  products: Product[];
  isLoading: boolean;
  fetchProducts: (retryCount?: number) => Promise<void>;
  addProduct: (product: { name: string, barcode: string, price: number, category: string, costPrice?: number }) => Promise<boolean>;
  updateProduct: (id: string, updates: Partial<{ name: string, barcode: string, price: number, category: string }>) => Promise<boolean>;
  updateStock: (productId: string, newStock: number, user: { id: string, email: string }) => Promise<boolean>;
  deleteProduct: (id: string) => Promise<boolean>;
}

export const useProductStore = create<ProductStore>((set) => ({
  products: [],
  isLoading: false,
  fetchProducts: async (retryCount = 0) => {
    // Only show global loading if we don't have any products yet
    const currentProducts = useProductStore.getState().products;
    if (currentProducts.length === 0) {
      set({ isLoading: true });
    }
    
    try {
      if (currentProducts.length === 0) {
        const localProducts = await db.products.toArray();
        if (localProducts.length > 0) {
          set({ products: localProducts, isLoading: false });
        }
      }
    } catch (err) {
      console.error('Dexie fetch error:', err);
    }
    
    const { data, error } = await supabase
      .from('products')
      .select('id, name, barcode, base_price, inventory(stock_qty)')
      .order('name', { ascending: true });

    if (error && error.message.includes('another request stole it') && retryCount < 3) {
      setTimeout(() => useProductStore.getState().fetchProducts(retryCount + 1), 150 + Math.random() * 200);
      return;
    }

    if (!error && data) {
      const mapped = data.map((d: any) => {
        const totalStock = d.inventory?.reduce((sum: number, item: any) => sum + (item.stock_qty || 0), 0) || 0;
        return {
          id: d.id,
          name: d.name,
          barcode: d.barcode || '',
          price: d.price ?? d.base_price ?? 0,
          cost_price: d.cost_price ?? 0,
          category: 'General',
          stock: totalStock
        };
      });
      
      try {
        await db.products.clear();
        await db.products.bulkAdd(mapped);
      } catch (err) {
        console.error('Dexie bulk add error:', err);
      }
      
      set({ products: mapped, isLoading: false });
    } else {
      set({ isLoading: false });
    }
  },
  addProduct: async (product) => {
    const insertData: any = {
      name: product.name.trim(),
      barcode: product.barcode?.trim() || 'PRO-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      base_price: Math.round(product.price),
      category: product.category || 'General',
      is_active: true
    };
    
    const { error } = await supabase.from('products').insert([insertData]);
    if (!error) {
       await useProductStore.getState().fetchProducts();
       return true;
    }
    return false;
  },
  updateProduct: async (id, updates) => {
    const updateData: any = {};
    if (updates.name) updateData.name = updates.name.trim();
    if (updates.barcode) updateData.barcode = updates.barcode.trim();
    if (updates.price !== undefined) updateData.base_price = Math.round(updates.price);
    if (updates.category) updateData.category = updates.category;

    const { error } = await supabase.from('products').update(updateData).eq('id', id);
    if (!error) {
       // Log activity if important fields changed
       try {
         const old = useProductStore.getState().products.find(p => p.id === id);
         const details = [];
         if (updates.name && updates.name !== old?.name) details.push(`name to ${updates.name}`);
         if (updates.price !== undefined && updates.price !== old?.price) details.push(`price to ${updates.price}`);
         
         if (details.length > 0) {
           // We'll need user info here too if we want to log correctly,
           // but for now let's just use a generic 'System' or pass it if possible.
           // Since updateProduct is called from AddProductModal, we should probably 
           // pass user info there too. For now I'll just log locally.
           await db.activities.add({
             user_id: 'system',
             user_email: 'system',
             action: `Updated details of ${old?.name || 'Product'}`,
             details: `Changed ${details.join(', ')}`,
             timestamp: new Date().toISOString()
           });
         }
       } catch (e) {}

      await useProductStore.getState().fetchProducts();
      return true;
    }
    console.error('Update product error:', error);
    return false;
  },
  updateStock: async (productId, newStock, user) => {
    // 1. Fetch all inventory records for this product
    const { data: items, error: fetchError } = await supabase
      .from('inventory')
      .select('id, stock_qty')
      .eq('product_id', productId);

    let success = false;
    let oldStock = items?.reduce((sum, item) => sum + (item.stock_qty || 0), 0) || 0;

    if (items && items.length > 0) {
      // Update the first record to the new total and set all others to 0
      // This ensures the aggregate stock matches the user's input exactly
      const principalItem = items[0];
      const otherItems = items.slice(1);

      const { error: updateError } = await supabase
        .from('inventory')
        .update({ stock_qty: newStock, updated_at: new Date().toISOString() })
        .eq('id', principalItem.id);

      if (!updateError && otherItems.length > 0) {
        // Zero out other batches to prevent double-counting
        await supabase
          .from('inventory')
          .update({ stock_qty: 0, updated_at: new Date().toISOString() })
          .in('id', otherItems.map(i => i.id));
      }
      success = !updateError;
    } else {
      // No record exists, create the first one
      const { error: insertError } = await supabase
        .from('inventory')
        .insert([{
          product_id: productId,
          stock_qty: newStock,
          batch_number: 'INITIAL',
          updated_at: new Date().toISOString()
        }]);
      success = !insertError;
    }

    if (success) {
      // Record activity in local Dexie
      try {
        const product = useProductStore.getState().products.find(p => p.id === productId);
        await db.activities.add({
          user_id: user.id,
          user_email: user.email,
          action: `Updated stock of ${product?.name || 'Product'}`,
          details: `Changed stock level from ${oldStock} to ${newStock}`,
          timestamp: new Date().toISOString()
        });
      } catch (err) {
        console.error('Error recording activity:', err);
      }

      await useProductStore.getState().fetchProducts();
      return true;
    }
    return false;
  },
  deleteProduct: async (id) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (!error) {
        await useProductStore.getState().fetchProducts();
        return true;
    }
    return false;
  },
}));
