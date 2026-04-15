'use client';

import React, { useState } from 'react';
import { useProcurementStore } from '../store/useProcurementStore';
import { Plus, Package, Truck } from 'lucide-react';

export function ProcurementForm() {
  const addItem = useProcurementStore((s) => s.addItem);
  const [form, setForm] = useState({
    product: '',
    qty: '',
    cost: '',
    supplier: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addItem({
      name: form.product,
      qty: parseInt(form.qty) || 0,
      cost: parseInt(form.cost) || 0,
      supplier: form.supplier
    });
    setForm({ ...form, product: '', qty: '', cost: '' });
  };

  return (
    <div className="card-pharm shadow-elevation form-card" style={{ padding: '0', overflow: 'hidden' }}>
      <style>{`
        .btn-press:active { transform: scale(0.98); }
        .shadow-elevation { box-shadow: 0 12px 48px -12px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.6); }
        .form-card { background: linear-gradient(165deg, #ffffff 0%, #fcfdfd 100%); border: 1px solid rgba(226, 232, 240, 0.8); border-radius: 16px; }
      `}</style>

      {/* ── Sub-header ── */}
      <div style={{
        padding: '28px 32px 24px', borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
        display: 'flex', alignItems: 'center', gap: '16px',
        background: 'linear-gradient(135deg, rgba(248,250,252,0.8) 0%, rgba(241,245,249,0.4) 100%)',
      }}>
        <div style={{
          width: 46, height: 46, borderRadius: '14px',
          background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#4f46e5',
          boxShadow: '0 4px 12px rgba(79, 70, 229, 0.15)',
        }}>
          <Truck size={24} strokeWidth={1.5} />
        </div>
        <div>
          <h2 className="heading-section" style={{ color: '#1e293b', fontSize: '18px' }}>Log New Arrival</h2>
          <p className="text-meta" style={{ marginTop: '2px', fontSize: '13px', color: '#64748b' }}>
            Enter supplier and product details to queue stock.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Supplier Name *
          </label>
          <input
            required
            type="text"
            placeholder="e.g. MedLink Pharma Ltd."
            className="input-pharm"
            style={{ height: '44px', border: '1px solid #cbd5e1', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}
            value={form.supplier}
            onChange={(e) => setForm({ ...form, supplier: e.target.value })}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Product Name *
          </label>
          <div style={{ position: 'relative' }}>
             <div style={{ position: 'absolute', left: '12px', top: '13px', color: '#94a3b8' }}>
               <Package size={16} strokeWidth={1.5} />
             </div>
             <input
               required
               type="text"
               placeholder="Type drug name…"
               className="input-pharm"
               style={{ height: '44px', paddingLeft: '40px', border: '1px solid #cbd5e1', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}
               value={form.product}
               onChange={(e) => setForm({ ...form, product: e.target.value })}
             />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Quantity Received *
            </label>
            <input
              required
              type="number"
              placeholder="0"
              className="input-pharm"
              style={{ height: '44px', fontVariantNumeric: 'tabular-nums', border: '1px solid #cbd5e1', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}
              value={form.qty}
              onChange={(e) => setForm({ ...form, qty: e.target.value })}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Cost Per Unit (TZS) *
            </label>
            <input
              required
              type="number"
              placeholder="0"
              className="input-pharm"
              style={{ height: '44px', fontVariantNumeric: 'tabular-nums', border: '1px solid #cbd5e1', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}
              value={form.cost}
              onChange={(e) => setForm({ ...form, cost: e.target.value })}
            />
          </div>
        </div>

        <button
          type="submit"
          className="btn-primary btn-press"
          style={{ width: '100%', justifyContent: 'center', height: '48px', marginTop: '8px', fontWeight: 700, fontSize: '15px', background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)', border: 'none', boxShadow: '0 4px 14px rgba(79, 70, 229, 0.3)', transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)' }}
        >
          <Plus size={20} strokeWidth={2.5} />
          Add to Order Preview
        </button>
      </form>
    </div>
  );
}
