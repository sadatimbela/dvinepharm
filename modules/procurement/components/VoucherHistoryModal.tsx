'use client';

import React, { useEffect, useState } from 'react';
import { X, FileText, Loader2, Package, Clock, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { supabase } from '@/utils/supabase';
import { formatCurrency } from '@/utils/currency';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface ProcurementRecord {
  id: string;
  status: string;
  total_cost: number;
  received_at: string | null;
  created_at: string;
  supplier: { name: string } | null;
  items: {
    id: string;
    quantity: number;
    unit_cost: number;
    total_cost: number;
    product: { name: string } | null;
  }[];
}

export function VoucherHistoryModal({ isOpen, onClose }: Props) {
  const [records, setRecords] = useState<ProcurementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    loadRecords();
  }, [isOpen]);

  async function loadRecords() {
    setLoading(true);
    setError('');

    const { data, error: fetchErr } = await supabase
      .from('procurements')
      .select(`
        id, status, total_cost, received_at, created_at,
        supplier:suppliers(name),
        items:procurement_items(id, quantity, unit_cost, total_cost, product:products(name))
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (fetchErr) {
      console.error('Voucher history fetch error:', fetchErr);
      setError(fetchErr.message);
    } else {
      setRecords(
        (data || []).map((d: any) => ({
          ...d,
          supplier: d.supplier ?? null,
          items: d.items ?? [],
        }))
      );
    }
    setLoading(false);
  }

  function toggleExpand(id: string) {
    setExpandedId(prev => (prev === id ? null : id));
  }

  if (!isOpen) return null;

  const statusColors: Record<string, { bg: string; fg: string }> = {
    received:  { bg: 'var(--status-success-bg)', fg: 'var(--status-success)' },
    pending:   { bg: '#fef9c3', fg: '#a16207' },
    cancelled: { bg: 'var(--status-critical-bg)', fg: 'var(--status-critical)' },
  };

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
          width: '100%', maxWidth: '720px',
          background: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(24px) saturate(150%)',
          borderRadius: 'var(--r-lg)',
          border: '1px solid transparent',
          backgroundClip: 'padding-box',
          boxShadow:
            '0 24px 64px rgba(0,0,0,0.12), 0 8px 24px rgba(0,0,0,0.06),' +
            'inset 0 1px 0 rgba(255,255,255,0.9)',
          animation: 'slideUp 200ms cubic-bezier(0.2,0,0,1) forwards',
          maxHeight: '85vh',
          display: 'flex', flexDirection: 'column',
        }}
      >
        {/* ── Header ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '24px 28px 16px',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: 38, height: 38, borderRadius: '10px',
              background: 'linear-gradient(135deg, #e0e7ff, #c7d2fe)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <FileText size={18} color="#4f46e5" strokeWidth={2} />
            </div>
            <div>
              <h2 style={{ fontWeight: 700, fontSize: '17px', margin: 0 }}>Voucher History</h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                Past procurement records & stock arrivals
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', padding: '6px', borderRadius: '6px',
            display: 'flex', transition: 'all 130ms',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-base)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Body ── */}
        <div style={{ overflowY: 'auto', padding: '16px 28px 24px', flex: 1 }}>
          {error && (
            <div style={{
              display: 'flex', gap: '10px', alignItems: 'flex-start',
              padding: '12px 14px', borderRadius: 'var(--r-sm)',
              background: 'var(--status-critical-bg)',
              border: '1px solid rgba(220,38,38,0.2)',
              marginBottom: '16px',
            }}>
              <AlertCircle size={16} style={{ color: 'var(--status-critical)', flexShrink: 0, marginTop: '1px' }} />
              <p style={{ fontSize: '13px', color: 'var(--status-critical)', margin: 0 }}>{error}</p>
            </div>
          )}

          {loading ? (
            <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
              <p style={{ margin: 0, fontWeight: 600, fontSize: '14px' }}>Loading vouchers…</p>
            </div>
          ) : records.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Package size={32} style={{ opacity: 0.3, margin: '0 auto 12px' }} />
              <p style={{ fontWeight: 600, margin: '0 0 4px' }}>No procurement records yet</p>
              <p style={{ fontSize: '13px', margin: 0 }}>Records will appear here when you process procurement orders.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {records.map(record => {
                const isExpanded = expandedId === record.id;
                const colors = statusColors[record.status] ?? statusColors.pending;
                const itemCount = record.items.length;
                const computedTotal = record.items.reduce((s, i) => s + (i.total_cost || i.quantity * i.unit_cost), 0);
                const displayTotal = record.total_cost || computedTotal;

                return (
                  <div key={record.id} style={{
                    borderRadius: 'var(--r-sm)',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-card)',
                    overflow: 'hidden',
                    transition: 'box-shadow 150ms',
                  }}>
                    {/* Row summary — clickable */}
                    <button
                      onClick={() => toggleExpand(record.id)}
                      style={{
                        width: '100%', border: 'none', background: 'none',
                        padding: '14px 16px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '12px',
                        textAlign: 'left', transition: 'background 120ms',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-base)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
                    >
                      {/* Date icon */}
                      <div style={{
                        width: 36, height: 36, borderRadius: '8px',
                        background: 'var(--accent-light)', color: 'var(--accent)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <Clock size={16} strokeWidth={2} />
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{
                            fontFamily: 'var(--font-mono)', fontSize: '12px',
                            color: 'var(--text-secondary)', fontWeight: 600,
                          }}>
                            #{record.id.split('-')[0].toUpperCase()}
                          </span>
                          <span style={{
                            fontSize: '11px', fontWeight: 700, textTransform: 'uppercase',
                            padding: '2px 8px', borderRadius: '999px',
                            background: colors.bg, color: colors.fg,
                            letterSpacing: '0.04em',
                          }}>
                            {record.status}
                          </span>
                        </div>
                        <p style={{ margin: '3px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                          {new Date(record.created_at).toLocaleString('en-US', {
                            dateStyle: 'medium', timeStyle: 'short',
                          })}
                          {record.supplier ? ` · ${(record.supplier as any).name}` : ''}
                          {` · ${itemCount} item${itemCount !== 1 ? 's' : ''}`}
                        </p>
                      </div>

                      {/* Total + chevron */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                        <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                          {formatCurrency(displayTotal)}
                        </span>
                        {isExpanded ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
                      </div>
                    </button>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div style={{
                        borderTop: '1px solid var(--border)',
                        padding: '0',
                        animation: 'fadeIn 120ms ease',
                      }}>
                        {record.items.length === 0 ? (
                          <p style={{ padding: '16px', margin: 0, fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}>
                            No line items recorded.
                          </p>
                        ) : (
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                            <thead>
                              <tr style={{ background: 'var(--bg-base)' }}>
                                <th style={{ padding: '8px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Product</th>
                                <th style={{ padding: '8px 16px', textAlign: 'right', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Qty</th>
                                <th style={{ padding: '8px 16px', textAlign: 'right', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Unit Cost</th>
                                <th style={{ padding: '8px 16px', textAlign: 'right', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {record.items.map((item) => (
                                <tr key={item.id} style={{ borderTop: '1px solid var(--border)' }}>
                                  <td style={{ padding: '10px 16px', color: 'var(--text-primary)', fontWeight: 500 }}>
                                    {(item.product as any)?.name ?? 'Unknown Product'}
                                  </td>
                                  <td style={{ padding: '10px 16px', textAlign: 'right', color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
                                    {item.quantity}
                                  </td>
                                  <td style={{ padding: '10px 16px', textAlign: 'right', color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
                                    {formatCurrency(item.unit_cost)}
                                  </td>
                                  <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                                    {formatCurrency(item.total_cost || item.quantity * item.unit_cost)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
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
        @keyframes fadeIn   { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp  { from { opacity: 0; transform: translateY(16px) scale(0.98) } to { opacity: 1; transform: translateY(0) scale(1) } }
        @keyframes spin     { to { transform: rotate(360deg) } }
      `}</style>
    </div>
  );
}
