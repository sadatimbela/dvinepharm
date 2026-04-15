'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Package, Loader2, Check, AlertCircle, Barcode, ScanText } from 'lucide-react';
import { supabase } from '@/utils/supabase';
import { useInventoryStore, InventoryItem } from '../store/useInventoryStore';
import { BarcodeScanner } from '@/components/ui/BarcodeScanner';

interface Props { 
  onClose: () => void; 
  item?: InventoryItem | null;
}

interface Form {
  name: string;
  barcode: string;
  category: string;
  price: string;
  costPrice: string;
  initialStock: string;
  reorderLevel: string;
  expiryDate: string;
  supplierName: string;
}

const CATEGORIES = [
  'General', 'Antibiotics', 'Analgesics', 'Antidiabetics',
  'Antihypertensives', 'Supplements', 'Antiparasitics', 'Other',
];

const empty: Form = {
  name: '', barcode: '', category: 'General',
  price: '', costPrice: '', initialStock: '',
  reorderLevel: '20', expiryDate: '', supplierName: '',
};

export function AddInventoryModal({ onClose, item }: Props) {
  const { fetchInventory, updateItem } = useInventoryStore();
  const [form, setForm] = useState<Form>(empty);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const firstRef = useRef<HTMLInputElement>(null);

  /* Sync form with item if editing */
  useEffect(() => {
    if (item) {
      setForm({
        name: item.name,
        barcode: item.sku,
        category: item.category || 'General',
        price: item.price.toString(),
        costPrice: item.costPrice.toString(),
        initialStock: item.stock.toString(),
        reorderLevel: item.reorderLevel.toString(),
        expiryDate: item.expiry === 'N/A' ? '' : item.expiry,
        supplierName: '', // supplier is not tracked in current store
      });
    } else {
      setForm(empty);
    }
  }, [item]);

  /* Focus first field on mount */
  useEffect(() => { firstRef.current?.focus(); }, []);

  /* Close on Escape */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  function patch(field: keyof Form, value: string) {
    setForm(f => ({ ...f, [field]: value }));
    setError('');
  }

  function validate(): string {
    if (!form.name.trim())         return 'Product name is required.';
    if (!form.price.trim())        return 'Selling price is required.';
    if (isNaN(Number(form.price)) || Number(form.price) < 0)
                                   return 'Selling price must be a valid number.';
    if (!form.costPrice.trim())    return 'Cost price is required.';
    if (isNaN(Number(form.costPrice)) || Number(form.costPrice) < 0)
                                   return 'Cost price must be a valid number.';
    if (!form.initialStock.trim()) return 'Stock quantity is required.';
    if (isNaN(Number(form.initialStock)) || Number(form.initialStock) < 0)
                                   return 'Stock quantity must be a positive number.';
    return '';
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setIsSubmitting(true);
    setError('');

    try {
      if (item) {
        /* ── Edit Mode ── */
        await updateItem(item.id, {
          name: form.name.trim(),
          sku: form.barcode.trim(),
          price: Math.round(Number(form.price)),
          costPrice: Math.round(Number(form.costPrice)),
          stock: Math.round(Number(form.initialStock)),
          reorderLevel: Math.round(Number(form.reorderLevel)),
          expiry: form.expiryDate || 'N/A',
        });
      } else {
        /* ── Add Mode ── */
        /* 1 — Insert product */
        const { data: product, error: prodErr } = await supabase
          .from('products')
          .insert({
            name:       form.name.trim(),
            barcode:    form.barcode.trim() || 'PRO-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
            base_price: Math.round(Number(form.price)),
            is_active:  true,
          })
          .select()
          .single();

        if (prodErr || !product) throw new Error(prodErr?.message ?? 'Failed to create product.');

        /* 2 — Create fixed inventory entry */
        const nextYear = new Date();
        nextYear.setFullYear(nextYear.getFullYear() + 1);
        await supabase.from('inventory').insert([{
            product_id: product.id,
            stock_qty:  Math.round(Number(form.initialStock)),
            reorder_level: Math.round(Number(form.reorderLevel)),
            expiry_date: form.expiryDate || nextYear.toISOString().split('T')[0]
        }]);

        await fetchInventory();
      }

      setSuccess(true);
      setTimeout(onClose, 1200);

    } catch (err: any) {
      setError(err.message ?? 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(15, 23, 42, 0.35)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
        animation: 'fadeIn 160ms ease forwards',
      }}
    >
      <div
        style={{
          width: '100%', maxWidth: '560px',
          background: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(24px) saturate(150%)',
          borderRadius: 'var(--r-lg)',
          border: '1px solid transparent',
          backgroundClip: 'padding-box',
          boxShadow: '0 24px 64px rgba(0,0,0,0.12), 0 8px 24px rgba(0,0,0,0.06)',
          animation: 'slideUp 200ms cubic-bezier(0.2,0,0,1) forwards',
          maxHeight: '90vh', overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 28px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: 38, height: 38, borderRadius: '10px', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={18} color="#fff" strokeWidth={2} />
            </div>
            <div>
              <h2 style={{ fontWeight: 700, fontSize: '17px', margin: 0 }}>{item ? 'Edit Inventory Item' : 'Add Inventory Item'}</h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                {item ? `Updating logs for ${item.name}` : 'Creates a product and records initial stock'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ padding: '6px' }}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {error && <div style={{ padding: '12px', borderRadius: 'var(--r-sm)', background: 'var(--status-critical-bg)', color: 'var(--status-critical)', fontSize: '13px' }}>{error}</div>}
          {success && <div style={{ padding: '12px', borderRadius: 'var(--r-sm)', background: 'var(--status-success-bg)', color: 'var(--status-success)', fontSize: '13px', fontWeight: 600 }}>Action completed successfully!</div>}

          <SectionLabel>Product Details</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <FieldLabel required>Drug / Product Name</FieldLabel>
              <input ref={firstRef} className="input-pharm" required value={form.name} onChange={e => patch('name', e.target.value)} />
            </div>
            <div>
              <FieldLabel>Barcode / SKU</FieldLabel>
              <input className="input-pharm" value={form.barcode} onChange={e => patch('barcode', e.target.value)} />
            </div>
            <div>
              <FieldLabel>Category</FieldLabel>
              <select className="input-pharm" value={form.category} onChange={e => patch('category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <SectionLabel>Pricing & Stock</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <FieldLabel required>Selling Price</FieldLabel>
              <input className="input-pharm" type="number" required value={form.price} onChange={e => patch('price', e.target.value)} />
            </div>
            <div>
              <FieldLabel required>Stock Quantity</FieldLabel>
              <input className="input-pharm" type="number" required value={form.initialStock} onChange={e => patch('initialStock', e.target.value)} />
            </div>
            <div>
              <FieldLabel>Reorder Level</FieldLabel>
              <input className="input-pharm" type="number" value={form.reorderLevel} onChange={e => patch('reorderLevel', e.target.value)} />
            </div>
            <div>
              <FieldLabel>Expiry Date</FieldLabel>
              <input className="input-pharm" type="date" value={form.expiryDate} onChange={e => patch('expiryDate', e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
            <button type="button" className="btn-ghost" onClick={onClose} disabled={isSubmitting}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={isSubmitting || success} style={{ minWidth: '150px' }}>
              {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : item ? 'Update Item' : 'Add to Inventory'}
            </button>
          </div>
        </form>
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>{children}</div>;
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>{children}{required && <span style={{ color: 'var(--status-critical)' }}>*</span>}</label>;
}
