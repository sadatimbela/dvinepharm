'use client';

import React, { useEffect, useState } from 'react';
import { X, Loader2, Plus, Trash2, ShoppingCart, Package, Calendar } from 'lucide-react';
import { supabase } from '@/utils/supabase';
import { useProcurementModuleStore } from '../store/useProcurementModuleStore';
import { formatCurrency } from '@/utils/currency';

interface Props { isOpen: boolean; onClose: () => void; userId?: string; }

interface ProductOption { id: string; name: string; }

interface LineItem {
  _key: string;
  product_id: string;
  quantity_ordered: number;
  unit_cost: number;
}

export function CreatePOModal({ isOpen, onClose, userId }: Props) {
  const { suppliers, fetchSuppliers, createPurchaseOrder } = useProcurementModuleStore();
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [supplierId, setSupplierId] = useState('');
  const [notes, setNotes] = useState('');
  const [expectedDelivery, setExpectedDelivery] = useState('');
  const [items, setItems] = useState<LineItem[]>([{ _key: '1', product_id: '', quantity_ordered: 1, unit_cost: 0 }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    fetchSuppliers();
    supabase.from('products').select('id, name').eq('is_active', true).order('name').then(({ data }) => {
      if (data) setProducts(data);
    });
  }, [isOpen]);

  const total = items.reduce((s, i) => s + i.quantity_ordered * i.unit_cost, 0);

  function addLine() {
    setItems([...items, { _key: Math.random().toString(), product_id: '', quantity_ordered: 1, unit_cost: 0 }]);
  }

  function removeLine(key: string) {
    if (items.length <= 1) return;
    setItems(items.filter(i => i._key !== key));
  }

  function updateLine(key: string, field: keyof LineItem, value: any) {
    setItems(items.map(i => i._key === key ? { ...i, [field]: value } : i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!supplierId) { setError('Please select a supplier.'); return; }
    const validItems = items.filter(i => i.product_id && i.quantity_ordered > 0 && i.unit_cost > 0);
    if (validItems.length === 0) { setError('Add at least one item with valid quantity and cost.'); return; }

    setSaving(true);
    const result = await createPurchaseOrder({
      supplier_id: supplierId,
      notes,
      expected_delivery: expectedDelivery || undefined,
      created_by: userId,
      items: validItems.map(i => ({
        product_id: i.product_id,
        quantity_ordered: i.quantity_ordered,
        unit_cost: i.unit_cost,
      })),
    });

    if (result) {
      onClose();
      setItems([{ _key: '1', product_id: '', quantity_ordered: 1, unit_cost: 0 }]);
      setSupplierId('');
      setNotes('');
      setExpectedDelivery('');
    } else {
      setError('Failed to create purchase order. Check console for details.');
    }
    setSaving(false);
  }

  if (!isOpen) return null;

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(15,23,42,0.35)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', animation: 'fadeIn 160ms ease forwards' }}>
      <div style={{ width: '100%', maxWidth: '740px', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(24px)', borderRadius: 'var(--r-lg)', boxShadow: '0 24px 64px rgba(0,0,0,0.12)', animation: 'slideUp 200ms cubic-bezier(0.2,0,0,1) forwards', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 28px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: 38, height: 38, borderRadius: '10px', background: 'linear-gradient(135deg, #e0e7ff, #c7d2fe)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingCart size={18} color="#4f46e5" strokeWidth={2} />
            </div>
            <div>
              <h2 style={{ fontWeight: 700, fontSize: '17px', margin: 0 }}>Create Purchase Order</h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0' }}>Add items, select supplier, and submit for approval</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '6px', borderRadius: '6px', display: 'flex' }}><X size={18} /></button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '20px 28px 24px', flex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>

          {error && (
            <div style={{ padding: '10px 14px', borderRadius: 'var(--r-sm)', background: 'var(--status-critical-bg)', border: '1px solid rgba(220,38,38,0.2)', color: 'var(--status-critical)', fontSize: '13px' }}>{error}</div>
          )}

          {/* Supplier + expected delivery */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Supplier *</label>
              <select required className="input-pharm" value={supplierId} onChange={e => setSupplierId(e.target.value)}>
                <option value="">Select supplier…</option>
                {suppliers.filter(s => s.is_active).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={12} /> Expected Delivery</label>
              <input className="input-pharm" type="date" value={expectedDelivery} onChange={e => setExpectedDelivery(e.target.value)} min={new Date().toISOString().split('T')[0]} />
            </div>
          </div>

          {/* Items table */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Order Items</label>
              <button type="button" onClick={addLine} className="btn-ghost" style={{ fontSize: '12px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Plus size={13} /> Add Line
              </button>
            </div>

            <div style={{ borderRadius: 'var(--r-sm)', border: '1px solid var(--border)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-base)' }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Product</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', width: '100px' }}>Qty</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', width: '130px' }}>Unit Cost</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', width: '120px' }}>Total</th>
                    <th style={{ width: '40px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item._key} style={{ borderTop: '1px solid var(--border)' }}>
                      <td style={{ padding: '8px 12px' }}>
                        <select className="input-pharm" style={{ fontSize: '12px' }} value={item.product_id} onChange={e => updateLine(item._key, 'product_id', e.target.value)}>
                          <option value="">Select…</option>
                          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        <input className="input-pharm" type="number" min="1" style={{ textAlign: 'right', fontSize: '12px' }} value={item.quantity_ordered} onChange={e => updateLine(item._key, 'quantity_ordered', parseInt(e.target.value) || 0)} />
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        <input className="input-pharm" type="number" min="0" style={{ textAlign: 'right', fontSize: '12px' }} value={item.unit_cost} onChange={e => updateLine(item._key, 'unit_cost', parseFloat(e.target.value) || 0)} />
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: 'var(--text-primary)' }}>
                        {formatCurrency(item.quantity_ordered * item.unit_cost)}
                      </td>
                      <td style={{ padding: '8px 4px' }}>
                        <button type="button" onClick={() => removeLine(item._key)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1', padding: '4px', display: 'flex', borderRadius: '4px' }}
                          onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; }} onMouseLeave={e => { e.currentTarget.style.color = '#cbd5e1'; }}>
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px', padding: '10px 14px', background: 'var(--accent-light)', borderRadius: 'var(--r-sm)', border: '1px solid var(--accent-mid)' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent-dark)', marginRight: '12px' }}>Grand Total:</span>
              <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent)', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Notes (optional)</label>
            <textarea className="input-pharm" rows={2} placeholder="Any special instructions…" value={notes} onChange={e => setNotes(e.target.value)} style={{ resize: 'vertical' }} />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving} style={{ minWidth: '160px', justifyContent: 'center' }}>
              {saving ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Creating…</> : <><ShoppingCart size={14} /> Create PO</>}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px) scale(0.98) } to { opacity: 1; transform: translateY(0) scale(1) } }
        @keyframes spin    { to { transform: rotate(360deg) } }
      `}</style>
    </div>
  );
}
