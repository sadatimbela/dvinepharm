'use client';

import React, { useEffect, useState } from 'react';
import { 
  X, History, TrendingUp, TrendingDown, Minus, 
  Search, Filter, ExternalLink, Calendar
} from 'lucide-react';
import { useProcurementModuleStore, PriceHistoryEntry } from '../store/useProcurementModuleStore';
import { formatCurrency } from '@/utils/currency';

interface Props { isOpen: boolean; onClose: () => void; }

export function PriceHistoryModal({ isOpen, onClose }: Props) {
  const { priceHistory, fetchPriceHistory } = useProcurementModuleStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetchPriceHistory().then(() => setLoading(false));
  }, [isOpen, fetchPriceHistory]);

  const filtered = priceHistory.filter(h => 
    h.product?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.supplier?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group by product to calculate trends
  const trendsByProduct: Record<string, PriceHistoryEntry[]> = {};
  priceHistory.forEach(h => {
    if (!trendsByProduct[h.product_id]) trendsByProduct[h.product_id] = [];
    trendsByProduct[h.product_id].push(h);
  });

  if (!isOpen) return null;

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(15,23,42,0.35)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', animation: 'fadeIn 160ms ease forwards' }}>
      <div style={{ width: '100%', maxWidth: '820px', background: 'rgba(255,255,255,0.98)', backdropFilter: 'blur(32px)', borderRadius: 'var(--r-lg)', boxShadow: '0 24px 64px rgba(0,0,0,0.12)', animation: 'slideUp 200ms cubic-bezier(0.2,0,0,1) forwards', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 28px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: 38, height: 38, borderRadius: '10px', background: 'linear-gradient(135deg, #ccfbf1, #99f6e4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={18} color="#0d9488" strokeWidth={2} />
            </div>
            <div>
              <h2 style={{ fontWeight: 700, fontSize: '17px', margin: 0 }}>Price Trend Analytics</h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0' }}>Monitor cost fluctuations per supplier over time</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '6px', borderRadius: '6px', display: 'flex' }}><X size={18} /></button>
        </div>

        {/* Filters */}
        <div style={{ padding: '16px 28px', borderBottom: '1px solid var(--border)', background: 'var(--bg-base)', display: 'flex', gap: '12px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="input-pharm" placeholder="Filter by product or supplier…" style={{ paddingLeft: '34px', height: '38px', fontSize: '13px' }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <button className="btn-secondary" style={{ height: '38px', fontSize: '12px', padding: '0 12px' }}>
            <Calendar size={14} style={{ marginRight: '6px' }} /> Last 6 Months
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', padding: '0', flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-base)', zIndex: 10, borderBottom: '1px solid var(--border)' }}>
              <tr>
                <th style={{ padding: '12px 28px', textAlign: 'left', fontWeight: 700, textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Product & Supplier</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Purchase Price</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700, textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Trend</th>
                <th style={{ padding: '12px 28px', textAlign: 'right', fontWeight: 700, textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading records…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={4} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>No price history found.</td></tr>
              ) : (
                filtered.map((h, idx) => {
                  // Basic trend logic: compare with previous entry for same product
                  const prodEntries = trendsByProduct[h.product_id];
                  const selfIdx = prodEntries.findIndex(e => e.id === h.id);
                  const prevIdx = selfIdx + 1;
                  const prevEntry = prevIdx < prodEntries.length ? prodEntries[prevIdx] : null;
                  
                  let trend = <Minus size={14} color="#94a3b8" />;
                  if (prevEntry) {
                    if (h.unit_cost > prevEntry.unit_cost) trend = <TrendingUp size={14} color="#f43f5e" />;
                    else if (h.unit_cost < prevEntry.unit_cost) trend = <TrendingDown size={14} color="#10b981" />;
                  }

                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border)', transition: 'background 120ms' }}>
                      <td style={{ padding: '14px 28px' }}>
                        <p style={{ margin: 0, fontWeight: 700, color: 'var(--text-primary)' }}>{h.product?.name}</p>
                        <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          from {h.supplier?.name}
                        </p>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                        {formatCurrency(h.unit_cost)}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', padding: '4px', borderRadius: '4px', background: 'var(--bg-base)' }}>
                          {trend}
                        </div>
                      </td>
                      <td style={{ padding: '14px 28px', textAlign: 'right', color: 'var(--text-muted)', fontSize: '12px' }}>
                        {new Date(h.recorded_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
