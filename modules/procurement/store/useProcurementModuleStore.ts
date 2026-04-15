import { create } from 'zustand';
import { supabase } from '@/utils/supabase';

/* ─── Types ─── */

export interface Supplier {
  id: string;
  name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  payment_terms: string;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  avg_price_rating?: number;
  avg_delivery_rating?: number;
  avg_reliability_rating?: number;
  products_supplied?: { id: string; name: string }[];
}

export interface SupplierRating {
  id: string;
  supplier_id: string;
  price_rating: number;
  delivery_rating: number;
  reliability_rating: number;
  comment: string | null;
  created_at: string;
  rated_by_name?: string;
}

export interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_id: string | null;
  supplier?: { name: string } | null;
  status: string;
  total_amount: number;
  notes: string | null;
  expected_delivery: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_by: string | null;
  created_at: string;
  items?: POItem[];
  shipment?: Shipment | null;
}

export interface POItem {
  id: string;
  po_id: string;
  product_id: string;
  product?: { name: string } | null;
  quantity_ordered: number;
  quantity_received: number;
  unit_cost: number;
  total_cost: number;
}

export interface Shipment {
  id: string;
  po_id: string;
  tracking_number: string | null;
  carrier: string | null;
  status: string;
  shipped_at: string | null;
  estimated_arrival: string | null;
  actual_arrival: string | null;
  notes: string | null;
}

export interface PriceHistoryEntry {
  id: string;
  product_id: string;
  supplier_id: string;
  unit_cost: number;
  recorded_at: string;
  product?: { name: string } | null;
  supplier?: { name: string } | null;
}

/* ─── Store ─── */

export interface ProcurementGoal {
  id: string;
  title: string;
  target_type: 'spend_limit' | 'order_count' | 'supplier_reliability' | 'stock_availability';
  target_value: number;
  current_value: number;
  start_date: string;
  end_date: string;
  status: 'active' | 'reached' | 'failed' | 'archived';
  created_at: string;
}

interface ProcurementModuleStore {
  suppliers: Supplier[];
  suppliersLoading: boolean;
  fetchSuppliers: () => Promise<void>;
  addSupplier: (s: Partial<Supplier>) => Promise<boolean>;
  updateSupplier: (id: string, s: Partial<Supplier>) => Promise<boolean>;
  
  ratings: (SupplierRating & { rated_by_name?: string })[];
  fetchRatings: (supplierId: string) => Promise<void>;
  addRating: (r: { supplier_id: string; price_rating: number; delivery_rating: number; reliability_rating: number; comment?: string; rated_by?: string }) => Promise<boolean>;
  
  purchaseOrders: PurchaseOrder[];
  posLoading: boolean;
  fetchPurchaseOrders: () => Promise<void>;
  createPurchaseOrder: (po: { supplier_id: string; notes?: string; expected_delivery?: string; created_by?: string; items: { product_id: string; quantity_ordered: number; unit_cost: number }[] }) => Promise<string | null>;
  updatePOStatus: (poId: string, status: string, approvedBy?: string) => Promise<boolean>;

  receiveStock: (poId: string, items: { po_item_id: string; product_id: string; quantity_received: number; batch_number?: string; expiry_date?: string; cost_price: number }[], receivedBy?: string) => Promise<boolean>;

  priceHistory: PriceHistoryEntry[];
  fetchPriceHistory: (productId?: string, supplierId?: string) => Promise<void>;

  shipments: Shipment[];
  fetchShipments: () => Promise<void>;
  createShipment: (s: Partial<Shipment> & { po_id: string }) => Promise<boolean>;
  updateShipment: (id: string, s: Partial<Shipment>) => Promise<boolean>;

  // Goals
  goals: ProcurementGoal[];
  goalsLoading: boolean;
  fetchGoals: () => Promise<void>;
  addGoal: (g: Partial<ProcurementGoal>) => Promise<boolean>;
  updateGoalStatus: (id: string, status: string) => Promise<boolean>;
}

export const useProcurementModuleStore = create<ProcurementModuleStore>((set, get) => ({

  /* ════════════════════════════════════════════════════════════════
     SUPPLIERS
     ════════════════════════════════════════════════════════════════ */
  suppliers: [],
  suppliersLoading: false,

  fetchSuppliers: async () => {
    set({ suppliersLoading: true });
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('name', { ascending: true });
    if (!error && data) {
      // Fetch aggregate ratings for each supplier
      const { data: ratings } = await supabase
        .from('supplier_ratings')
        .select('supplier_id, price_rating, delivery_rating, reliability_rating');

      const ratingMap: Record<string, { prices: number[]; deliveries: number[]; reliabilities: number[] }> = {};
      (ratings || []).forEach((r: any) => {
        if (!ratingMap[r.supplier_id]) ratingMap[r.supplier_id] = { prices: [], deliveries: [], reliabilities: [] };
        ratingMap[r.supplier_id].prices.push(r.price_rating);
        ratingMap[r.supplier_id].deliveries.push(r.delivery_rating);
        ratingMap[r.supplier_id].reliabilities.push(r.reliability_rating);
      });

      const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

      set({
        suppliers: data.map((s: any) => ({
          ...s,
          payment_terms: s.payment_terms || 'net_30',
          is_active: s.is_active ?? true,
          avg_price_rating: avg(ratingMap[s.id]?.prices ?? []),
          avg_delivery_rating: avg(ratingMap[s.id]?.deliveries ?? []),
          avg_reliability_rating: avg(ratingMap[s.id]?.reliabilities ?? []),
        })),
        suppliersLoading: false,
      });
    } else {
      console.error('Fetch suppliers error:', error);
      set({ suppliersLoading: false });
    }
  },

  addSupplier: async (s) => {
    const { error } = await supabase.from('suppliers').insert([{
      name: s.name?.trim(),
      contact_name: s.contact_name?.trim() || null,
      phone: s.phone?.trim() || null,
      email: s.email?.trim() || null,
      address: s.address?.trim() || null,
      payment_terms: s.payment_terms || 'net_30',
      notes: s.notes?.trim() || null,
    }]);
    if (error) { 
      console.error('Add supplier error:', error.message, error.details); 
      return false; 
    }
    await get().fetchSuppliers();
    return true;
  },

  updateSupplier: async (id, s) => {
    const { error } = await supabase.from('suppliers').update({
      ...s,
      updated_at: new Date().toISOString(),
    }).eq('id', id);
    if (error) { console.error('Update supplier error:', error); return false; }
    await get().fetchSuppliers();
    return true;
  },

  /* ════════════════════════════════════════════════════════════════
     RATINGS
     ════════════════════════════════════════════════════════════════ */
  ratings: [],

  fetchRatings: async (supplierId) => {
    const { data, error } = await supabase
      .from('supplier_ratings')
      .select('*, rated_by_ref:staffs(full_name)')
      .eq('supplier_id', supplierId)
      .order('created_at', { ascending: false });
    if (!error && data) {
      set({
        ratings: data.map((r: any) => ({
          ...r,
          rated_by_name: r.rated_by_ref?.full_name || 'Unknown',
        })),
      });
    }
  },

  addRating: async (r) => {
    const { error } = await supabase.from('supplier_ratings').insert([r]);
    if (error) { console.error('Add rating error:', error); return false; }
    await get().fetchSuppliers(); // refresh aggregated ratings
    return true;
  },

  /* ════════════════════════════════════════════════════════════════
     PURCHASE ORDERS
     ════════════════════════════════════════════════════════════════ */
  purchaseOrders: [],
  posLoading: false,

  fetchPurchaseOrders: async () => {
    set({ posLoading: true });
    const { data, error } = await supabase
      .from('purchase_orders')
      .select(`
        *, 
        supplier:suppliers(name),
        items:po_items(*, product:products(name)),
        shipment:shipments(*)
      `)
      .order('created_at', { ascending: false });
    if (!error && data) {
      set({
        purchaseOrders: data.map((po: any) => ({
          ...po,
          supplier: po.supplier ?? null,
          items: po.items ?? [],
          shipment: Array.isArray(po.shipment) ? po.shipment[0] ?? null : po.shipment,
        })),
        posLoading: false,
      });
    } else {
      console.error('Fetch POs error:', error);
      set({ posLoading: false });
    }
  },

  createPurchaseOrder: async ({ supplier_id, notes, expected_delivery, created_by, items }) => {
    const totalAmount = items.reduce((s, i) => s + i.quantity_ordered * i.unit_cost, 0);
    const poNumber = 'PO-' + Date.now().toString().slice(-8);

    const { data, error } = await supabase
      .from('purchase_orders')
      .insert([{
        po_number: poNumber,
        supplier_id,
        status: 'pending',
        total_amount: totalAmount,
        notes: notes || null,
        expected_delivery: expected_delivery || null,
        created_by: created_by || null,
      }])
      .select('id')
      .single();

    if (error || !data) { 
      console.error('Create PO error:', error?.message, error?.details); 
      return null; 
    }

    const poItems = items.map(i => ({
      po_id: data.id,
      product_id: i.product_id,
      quantity_ordered: i.quantity_ordered,
      unit_cost: i.unit_cost,
    }));

    const { error: itemsErr } = await supabase.from('po_items').insert(poItems);
    if (itemsErr) { 
      console.error('Create PO items error:', itemsErr?.message, itemsErr?.details); 
      return null; 
    }

    // Record price history
    for (const item of items) {
      await supabase.from('price_history').insert([{
        product_id: item.product_id,
        supplier_id,
        unit_cost: item.unit_cost,
        po_id: data.id,
      }]);
    }

    await get().fetchPurchaseOrders();
    return data.id;
  },

  updatePOStatus: async (poId, status, approvedBy) => {
    const updates: any = { status, updated_at: new Date().toISOString() };
    if (status === 'approved' && approvedBy) {
      updates.approved_by = approvedBy;
      updates.approved_at = new Date().toISOString();
    }
    const { error } = await supabase.from('purchase_orders').update(updates).eq('id', poId);
    if (error) { console.error('Update PO status error:', error); return false; }
    await get().fetchPurchaseOrders();
    return true;
  },

  /* ════════════════════════════════════════════════════════════════
     RECEIVE STOCK (GRN)
     ════════════════════════════════════════════════════════════════ */
  receiveStock: async (poId, items, receivedBy) => {
    try {
      // 1 — Create GRN header
      const { data: grn, error: grnErr } = await supabase
        .from('goods_received')
        .insert([{ po_id: poId, received_by: receivedBy || null }])
        .select('id')
        .single();
      if (grnErr || !grn) throw grnErr;

      // 2 — Insert GRN items + update inventory + update PO item received qty
      for (const item of items) {
        await supabase.from('grn_items').insert([{
          grn_id: grn.id,
          po_item_id: item.po_item_id,
          product_id: item.product_id,
          quantity_received: item.quantity_received,
          batch_number: item.batch_number || null,
          expiry_date: item.expiry_date || null,
          cost_price: item.cost_price,
        }]);

        // Update PO item received quantity
        const { data: poItem } = await supabase.from('po_items').select('quantity_received').eq('id', item.po_item_id).single();
        if (poItem) {
          await supabase.from('po_items').update({
            quantity_received: (poItem.quantity_received || 0) + item.quantity_received,
          }).eq('id', item.po_item_id);
        }

        // Create inventory batch
        await supabase.from('inventory').insert([{
          product_id: item.product_id,
          stock_qty: item.quantity_received,
          batch_number: item.batch_number || null,
          expiry_date: item.expiry_date || new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
        }]);
      }

      // 3 — Check if PO is fully received → update status
      const { data: poItems } = await supabase.from('po_items').select('quantity_ordered, quantity_received').eq('po_id', poId);
      if (poItems) {
        const allReceived = poItems.every((i: any) => i.quantity_received >= i.quantity_ordered);
        const someReceived = poItems.some((i: any) => i.quantity_received > 0);
        const newStatus = allReceived ? 'completed' : someReceived ? 'partially_received' : 'ordered';
        await supabase.from('purchase_orders').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', poId);
      }

      await get().fetchPurchaseOrders();
      return true;
    } catch (err) {
      console.error('Receive stock error:', err);
      return false;
    }
  },

  /* ════════════════════════════════════════════════════════════════
     PRICE HISTORY
     ════════════════════════════════════════════════════════════════ */
  priceHistory: [],

  fetchPriceHistory: async (productId, supplierId) => {
    let query = supabase.from('price_history').select('*, product:products(name), supplier:suppliers(name)').order('recorded_at', { ascending: false }).limit(100);
    if (productId) query = query.eq('product_id', productId);
    if (supplierId) query = query.eq('supplier_id', supplierId);
    const { data, error } = await query;
    if (!error && data) {
      set({ priceHistory: data as any });
    }
  },

  /* ════════════════════════════════════════════════════════════════
     SHIPMENTS
     ════════════════════════════════════════════════════════════════ */
  shipments: [],

  fetchShipments: async () => {
    const { data, error } = await supabase
      .from('shipments')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) set({ shipments: data as Shipment[] });
  },

  createShipment: async (s) => {
    const { error } = await supabase.from('shipments').insert([s]);
    if (error) { console.error('Create shipment error:', error); return false; }
    await get().fetchShipments();
    await get().fetchPurchaseOrders();
    return true;
  },

  updateShipment: async (id, s) => {
    const { error } = await supabase.from('shipments').update({ ...s, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) { console.error('Update shipment error:', error); return false; }
    await get().fetchShipments();
    await get().fetchPurchaseOrders();
    return true;
  },

  /* ════════════════════════════════════════════════════════════════
     GOALS
     ════════════════════════════════════════════════════════════════ */
  goals: [],
  goalsLoading: false,

  fetchGoals: async () => {
    set({ goalsLoading: true });
    const { data, error } = await supabase
      .from('procurement_goals')
      .select('*')
      .order('end_date', { ascending: true });
    if (!error && data) set({ goals: data as ProcurementGoal[], goalsLoading: false });
    else set({ goalsLoading: false });
  },

  addGoal: async (g) => {
    const { error } = await supabase.from('procurement_goals').insert([g]);
    if (error) { console.error('Add goal error:', error); return false; }
    await get().fetchGoals();
    return true;
  },

  updateGoalStatus: async (id, status) => {
    const { error } = await supabase.from('procurement_goals').update({ status }).eq('id', id);
    if (error) { console.error('Update goal status error:', error); return false; }
    await get().fetchGoals();
    return true;
  },
}));
