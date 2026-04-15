'use client';

import React, { useEffect, useState } from 'react';
import { X, Users, Plus, Loader2, Star, Phone, Mail, MapPin, FileText, ChevronDown, ChevronUp, Building2 } from 'lucide-react';
import { useProcurementModuleStore, Supplier } from '../store/useProcurementModuleStore';

interface Props { isOpen: boolean; onClose: () => void; }

const PAYMENT_TERMS: Record<string, string> = {
  net_7: 'Net 7 Days',
  net_15: 'Net 15 Days',
  net_30: 'Net 30 Days',
  net_60: 'Net 60 Days',
  cod: 'Cash on Delivery',
  prepaid: 'Prepaid',
};

export function SupplierListModal({ isOpen, onClose }: Props) {
  const { suppliers, suppliersLoading, fetchSuppliers, addSupplier, addRating, fetchRatings, ratings } = useProcurementModuleStore();
  const [showAdd, setShowAdd] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showRateId, setShowRateId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', contact_name: '', phone: '', email: '', address: '', payment_terms: 'net_30', notes: '' });
  const [rateForm, setRateForm] = useState({ price: 3, delivery: 3, reliability: 3, comment: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (isOpen) fetchSuppliers(); }, [isOpen]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const success = await addSupplier({
      name: form.name, contact_name: form.contact_name, phone: form.phone,
      email: form.email, address: form.address, payment_terms: form.payment_terms, notes: form.notes,
    });
    
    if (success) {
      setForm({ name: '', contact_name: '', phone: '', email: '', address: '', payment_terms: 'net_30', notes: '' });
      setShowAdd(false);
    } else {
      setError('Failed to add supplier. Please ensure the database schema matches (run add.sql).');
    }
    setSaving(false);
  }

  async function handleRate(supplierId: string) {
    setSaving(true);
    await addRating({
      supplier_id: supplierId,
      price_rating: rateForm.price,
      delivery_rating: rateForm.delivery,
      reliability_rating: rateForm.reliability,
      comment: rateForm.comment || undefined,
    });
    setRateForm({ price: 3, delivery: 3, reliability: 3, comment: '' });
    setShowRateId(null);
    setSaving(false);
  }

  function handleExpand(id: string) {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    fetchRatings(id);
  }

  if (!isOpen) return null;

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(15,23,42,0.35)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', animation: 'fadeIn 160ms ease forwards' }}>
      <div style={{ width: '100%', maxWidth: '780px', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(24px) saturate(150%)', borderRadius: 'var(--r-lg)', boxShadow: '0 24px 64px rgba(0,0,0,0.12), 0 8px 24px rgba(0,0,0,0.06)', animation: 'slideUp 200ms cubic-bezier(0.2,0,0,1) forwards', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 28px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: 38, height: 38, borderRadius: '10px', background: 'linear-gradient(135deg, #fef3c7, #fde68a)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={18} color="#d97706" strokeWidth={2} />
            </div>
            <div>
              <h2 style={{ fontWeight: 700, fontSize: '17px', margin: 0 }}>Supplier Directory</h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0' }}>{suppliers.length} registered supplier{suppliers.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setShowAdd(!showAdd)} className="btn-secondary" style={{ fontSize: '13px', padding: '6px 14px' }}>
              <Plus size={14} style={{ marginRight: '4px' }} /> Add
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '6px', borderRadius: '6px', display: 'flex' }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Add Form */}
        {showAdd && (
          <form onSubmit={handleAdd} style={{ padding: '16px 28px', borderBottom: '1px solid var(--border)', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {error && <div style={{ padding: '8px 12px', borderRadius: '6px', background: '#fee2e2', color: '#b91c1c', fontSize: '12px', fontWeight: 600 }}>{error}</div>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <input required className="input-pharm" placeholder="Company Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              <input className="input-pharm" placeholder="Contact Person" value={form.contact_name} onChange={e => setForm({ ...form, contact_name: e.target.value })} />
              <input className="input-pharm" placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              <input className="input-pharm" type="email" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              <input className="input-pharm" placeholder="Address" style={{ gridColumn: '1/-1' }} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
              <select className="input-pharm" value={form.payment_terms} onChange={e => setForm({ ...form, payment_terms: e.target.value })}>
                {Object.entries(PAYMENT_TERMS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <input className="input-pharm" placeholder="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button type="button" className="btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : 'Save Supplier'}</button>
            </div>
          </form>
        )}

        {/* Body */}
        <div style={{ overflowY: 'auto', padding: '16px 28px 24px', flex: 1 }}>
          {suppliersLoading ? (
            <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
              <p style={{ margin: 0, fontWeight: 600, fontSize: '14px' }}>Loading suppliers…</p>
            </div>
          ) : suppliers.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Users size={32} style={{ opacity: 0.3, margin: '0 auto 12px' }} />
              <p style={{ fontWeight: 600, margin: '0 0 4px' }}>No suppliers registered</p>
              <p style={{ fontSize: '13px', margin: 0 }}>Click "Add" above to register your first supplier.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {suppliers.map(s => {
                const isExpanded = expandedId === s.id;
                const overall = ((s.avg_price_rating || 0) + (s.avg_delivery_rating || 0) + (s.avg_reliability_rating || 0)) / 3;
                return (
                  <div key={s.id} style={{ borderRadius: 'var(--r-sm)', border: '1px solid var(--border)', background: 'var(--bg-card)', overflow: 'hidden' }}>
                    <button onClick={() => handleExpand(s.id)}
                      style={{ width: '100%', border: 'none', background: 'none', padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '14px', textAlign: 'left', transition: 'background 120ms' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-base)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                      <div style={{ width: 40, height: 40, borderRadius: '10px', background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Building2 size={18} strokeWidth={2} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>{s.name}</span>
                          <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '999px', background: s.is_active ? 'var(--status-success-bg)' : 'var(--status-critical-bg)', color: s.is_active ? 'var(--status-success)' : 'var(--status-critical)', fontWeight: 700, textTransform: 'uppercase' }}>
                            {s.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '16px', marginTop: '4px', fontSize: '12px', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                          {s.contact_name && <span>{s.contact_name}</span>}
                          {s.phone && <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Phone size={11} /> {s.phone}</span>}
                          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><FileText size={11} /> {PAYMENT_TERMS[s.payment_terms] || s.payment_terms}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                        {overall > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Star size={14} fill="#f59e0b" color="#f59e0b" />
                            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{overall.toFixed(1)}</span>
                          </div>
                        )}
                        {isExpanded ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div style={{ borderTop: '1px solid var(--border)', padding: '16px', background: 'var(--bg-base)', animation: 'fadeIn 120ms ease' }}>
                        {/* Details */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                          <RatingStat label="Price" value={s.avg_price_rating || 0} />
                          <RatingStat label="Delivery" value={s.avg_delivery_rating || 0} />
                          <RatingStat label="Reliability" value={s.avg_reliability_rating || 0} />
                        </div>

                        {s.email && <p style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', margin: '0 0 4px' }}><Mail size={12} /> {s.email}</p>}
                        {s.address && <p style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', margin: '0 0 12px' }}><MapPin size={12} /> {s.address}</p>}

                        {/* Rate button */}
                        {showRateId === s.id ? (
                          <div style={{ padding: '14px', borderRadius: '8px', border: '1px solid var(--border)', background: '#fff', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', margin: 0 }}>Rate This Supplier</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                              <RatingInput label="Price" value={rateForm.price} onChange={v => setRateForm({ ...rateForm, price: v })} />
                              <RatingInput label="Delivery" value={rateForm.delivery} onChange={v => setRateForm({ ...rateForm, delivery: v })} />
                              <RatingInput label="Reliability" value={rateForm.reliability} onChange={v => setRateForm({ ...rateForm, reliability: v })} />
                            </div>
                            <input className="input-pharm" placeholder="Optional comment…" value={rateForm.comment} onChange={e => setRateForm({ ...rateForm, comment: e.target.value })} />
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                              <button className="btn-ghost" type="button" onClick={() => setShowRateId(null)} style={{ fontSize: '12px' }}>Cancel</button>
                              <button className="btn-primary" type="button" onClick={() => handleRate(s.id)} disabled={saving} style={{ fontSize: '12px' }}>
                                {saving ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : 'Submit Rating'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button className="btn-secondary" onClick={() => setShowRateId(s.id)} style={{ fontSize: '12px', padding: '6px 14px' }}>
                            <Star size={13} style={{ marginRight: '4px' }} /> Rate Supplier
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px) scale(0.98) } to { opacity: 1; transform: translateY(0) scale(1) } }
        @keyframes spin    { to { transform: rotate(360deg) } }
      `}</style>
    </div>
  );
}

/* ── Small helpers ── */

function RatingStat({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ padding: '10px 12px', borderRadius: '8px', background: '#fff', border: '1px solid var(--border)', textAlign: 'center' }}>
      <p style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', margin: '0 0 4px', letterSpacing: '0.06em' }}>{label}</p>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
        {[1, 2, 3, 4, 5].map(i => (
          <Star key={i} size={14} fill={i <= Math.round(value) ? '#f59e0b' : 'none'} color={i <= Math.round(value) ? '#f59e0b' : '#d1d5db'} />
        ))}
        <span style={{ fontSize: '13px', fontWeight: 700, marginLeft: '4px', color: 'var(--text-primary)' }}>{value > 0 ? value.toFixed(1) : '—'}</span>
      </div>
    </div>
  );
}

function RatingInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</span>
      <div style={{ display: 'flex', gap: '2px' }}>
        {[1, 2, 3, 4, 5].map(i => (
          <button key={i} type="button" onClick={() => onChange(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}>
            <Star size={16} fill={i <= value ? '#f59e0b' : 'none'} color={i <= value ? '#f59e0b' : '#d1d5db'} />
          </button>
        ))}
      </div>
    </div>
  );
}
