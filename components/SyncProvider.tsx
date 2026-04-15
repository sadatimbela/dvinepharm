'use client';

import { useEffect, useRef } from 'react';
import { db } from '@/utils/db';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/hooks/useAuth';

export function SyncProvider() {
  const { user } = useAuth();
  const syncLock = useRef(false);

  useEffect(() => {
    if (!user) return;

    // ─── 1. INITIAL SYNC (Hydrate Dexie from Supabase) ───
    const hydrateDexie = async () => {
      if (syncLock.current) return;
      syncLock.current = true;
      
      try {
        console.log('🔄 Initializing sync...');
        
        // Fetch All Products with stock
        const { data: prods } = await supabase.from('products').select('*, inventory(stock_qty)');
        if (prods) {
          const mappedProds = prods.map((p: any) => ({
            id: p.id,
            name: p.name,
            barcode: p.barcode,
            price: p.base_price || 0,
            cost_price: p.cost_price || 0,
            category: p.category || 'General',
            stock: p.inventory?.reduce((sum: number, item: any) => sum + (item.stock_qty || 0), 0) || 0,
            created_at: p.created_at
          }));
          await db.products.bulkPut(mappedProds);
        }

        // Fetch Inventory
        const { data: inv } = await supabase.from('inventory').select('*');
        if (inv) await db.inventory.bulkPut(inv);

        // Fetch Recent Sales (last 100 for activity logs)
        const { data: recentSales } = await supabase
          .from('sales')
          .select('id, seller_id, total_amount, created_at')
          .eq('seller_id', user.id)
          .order('created_at', { ascending: false })
          .limit(100);
        
        if (recentSales) {
          await db.sales.bulkPut(recentSales.map(s => ({ ...s, localId: s.id, synced: true })));
        }

        console.log('✅ Dexie hydration complete');
      } catch (err) {
        console.error('❌ Sync hydration failed:', err);
      } finally {
        syncLock.current = false;
      }
    };

    hydrateDexie();

    // ─── 2. REAL-TIME SUBSCRIPTIONS ───
    const productsSub = supabase
      .channel('products-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
        if (payload.eventType === 'DELETE') db.products.delete(payload.old.id);
        else db.products.put(payload.new as any);
      })
      .subscribe();

    const inventorySub = supabase
      .channel('inventory-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory' }, (payload) => {
        if (payload.eventType === 'DELETE') db.inventory.delete(payload.old.id);
        else db.inventory.put(payload.new as any);
      })
      .subscribe();

    const salesSub = supabase
      .channel('sales-sync')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sales', filter: `seller_id=eq.${user.id}` }, (payload) => {
        db.sales.put({ ...payload.new, localId: payload.new.id, synced: true } as any);
      })
      .subscribe();

    // ─── 3. BACKGROUND PUSH (Local -> Cloud) ───
    const interval = setInterval(async () => {
      if (!navigator.onLine) return;

      try {
        // Find sales that haven't been pushed to Supabase yet
        const salesToPush = await db.sales.filter(s => s.synced === false).toArray();
        
        if (salesToPush.length === 0) return;

        for (const sale of salesToPush) {
          try {
            // 1. Push main sale record
            const { data: saleData, error: saleError } = await supabase
              .from('sales')
              .insert([{ 
                seller_id: sale.seller_id, 
                total_amount: Math.round(sale.total_amount),
                created_at: sale.created_at
              }])
              .select('id').single();

            if (saleError || !saleData) throw saleError;
            
            // 2. Push items if they exist
            if (sale.items && sale.items.length > 0) {
              const itemsToInsert = sale.items.map(i => ({
                sale_id: saleData.id,
                product_id: i.product_id,
                quantity: i.quantity,
                unit_price: i.unit_price
              }));
              await supabase.from('sale_items').insert(itemsToInsert);

              // 3. Deduct stock safely via RPC
              for (const item of sale.items) {
                await supabase.rpc('deduct_stock', { 
                  p_product_id: item.product_id, 
                  deduct_qty: item.quantity 
                });
              }
            }
            
            // Mark as synced locally
            await db.sales.update(sale.localId!, { id: saleData.id, synced: true });
          } catch (e) {
            console.error('Push failed for sale:', sale.localId, e);
          }
        }
      } catch (err) {
        console.error('Background push error:', err);
      }
    }, 15000);

    return () => {
      clearInterval(interval);
      supabase.removeChannel(productsSub);
      supabase.removeChannel(inventorySub);
      supabase.removeChannel(salesSub);
    };
  }, [user]);

  return null;
}
