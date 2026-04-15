import { create } from 'zustand';
import { supabase } from '@/utils/supabase';

export interface ProcurementItem {
  id: string; // temp local id
  name: string;
  qty: number;
  cost: number;
  supplier: string;
}

interface ProcurementStore {
  items: ProcurementItem[];
  addItem: (item: Omit<ProcurementItem, 'id'>) => void;
  removeItem: (id: string) => void;
  clearAll: () => void;
  processProcurement: () => Promise<boolean>;
}

export const useProcurementStore = create<ProcurementStore>((set, get) => ({
  items: [],
  addItem: (product) => set((s) => ({
    items: [...s.items, { ...product, id: Math.random().toString() }]
  })),
  removeItem: (id) => set((s) => ({
    items: s.items.filter(i => i.id !== id)
  })),
  clearAll: () => set({ items: [] }),
  processProcurement: async () => {
    const { items } = get();
    if (items.length === 0) return false;

    try {
      const supplierName = items[0].supplier || 'Unknown Supplier';

      // 1. Create a procurement header
      const { data: procData, error: procError } = await supabase
        .from('procurements')
        .insert([{ 
          status: 'received',
          received_at: new Date().toISOString()
        }])
        .select('id')
        .single();

      if (procError || !procData) throw procError;
      const procurementId = procData.id;

      // 2. Add items and update inventory
      for (const item of items) {
        let productId = null;
        
        const { data: existing } = await supabase
          .from('products')
          .select('id')
          .ilike('name', item.name.trim())
          .limit(1)
          .maybeSingle();
        
        if (existing?.id) {
          productId = existing.id;
        } else {
          // Auto-create product (ignoring cost_price as it might be missing)
          const { data: newProd, error: newProdErr } = await supabase
            .from('products')
            .insert([{ 
              name: item.name.trim(), 
              barcode: 'AUTO-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
              base_price: Math.round(item.cost * 1.5),
              is_active: true
            }])
            .select('id')
            .single();
            
          if (newProdErr) throw newProdErr;
          if (newProd) productId = newProd.id;
        }

        if (productId) {
          // Record procurement item
          await supabase.from('procurement_items').insert([{
            procurement_id: procurementId,
            product_id: productId,
            quantity: item.qty,
            unit_cost: item.cost
          }]);

          // IMPORTANT: Update concrete inventory table for stock tracking
          const { data: invRow } = await supabase
            .from('inventory')
            .select('id, stock_qty')
            .eq('product_id', productId)
            .limit(1)
            .maybeSingle();

          if (invRow?.id) {
            await supabase.from('inventory').update({ stock_qty: invRow.stock_qty + item.qty }).eq('id', invRow.id);
          } else {
            const nextYear = new Date();
            nextYear.setFullYear(nextYear.getFullYear() + 1);
            await supabase.from('inventory').insert([{
                product_id: productId,
                stock_qty: item.qty,
                expiry_date: nextYear.toISOString().split('T')[0]
            }]);
          }
        }
      }

      get().clearAll();
      return true;
    } catch (err) {
      console.error('Procurement error:', err);
      return false;
    }
  }
}));
