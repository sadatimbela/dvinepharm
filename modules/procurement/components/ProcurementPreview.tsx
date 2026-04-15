'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useProcurementStore } from '../store/useProcurementStore';
import { ShoppingBag, Trash2, ArrowRight, Loader2, PackageOpen, Clock, Tag, FileText } from 'lucide-react';
import { formatCurrency } from '@/utils/currency';

/* Hook for smooth numeric count-up animation */
function useCountUp(target: number, duration = 600): number {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let raf: number;
    const start = performance.now();
    // To ensure it animates smoothly from the *current* count
    let initialCount = 0;
    setCount(c => { initialCount = c; return c; });
    
    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(initialCount + (target - initialCount) * eased));
      
      if (progress < 1) {
        raf = requestAnimationFrame(step);
      }
    };
    
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  
  return count;
}

export function ProcurementPreview() {
  const { items, removeItem, clearAll } = useProcurementStore();
  const [isProcessing, setIsProcessing] = React.useState(false);
  
  const totalCost = items.reduce((sum, item) => sum + (item.qty * item.cost), 0);
  const animatedTotal = useCountUp(totalCost);

  // Generate a mock Batch ID that persists until the cart is emptied
  const batchId = useMemo(() => {
    return `PO-${Math.floor(Date.now() / 1000).toString().slice(-5)}`;
  }, [items.length === 0]); 

  const activeSupplier = items.length > 0 ? items[0].supplier : 'Pending selection';
  
  const handleCommit = async () => {
    setIsProcessing(true);
    const success = await useProcurementStore.getState().processProcurement();
    if (!success) {
      alert("Failed to process procurement");
    }
    setIsProcessing(false);
  };

  return (
    <div style={{ position: 'sticky', top: '88px' }}>
      <style>{`
        .preview-slide-in {
          animation: previewSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes previewSlideIn {
          from { opacity: 0; transform: translateX(12px) scale(0.98); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }
        .btn-press:active {
          transform: scale(0.98);
        }
        .shadow-elevation {
          box-shadow: 0 12px 48px -12px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.6);
        }
        .preview-card {
          background: linear-gradient(165deg, #ffffff 0%, #fcfdfd 100%);
          border: 1px solid rgba(226, 232, 240, 0.8);
          border-radius: 16px;
        }
        .preview-header {
          background: linear-gradient(135deg, rgba(248,250,252,0.8) 0%, rgba(241,245,249,0.4) 100%);
          backdrop-filter: blur(8px);
        }
      `}</style>

      <div className="preview-card shadow-elevation" style={{
        display: 'flex', flexDirection: 'column',
        maxHeight: 'calc(100vh - 120px)', overflow: 'hidden',
      }}>
        {/* ── Header ── */}
        <div className="preview-header" style={{
          padding: '20px 24px', borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: 42, height: 42, borderRadius: '12px',
                background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#4f46e5',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.15)',
              }}>
                <ShoppingBag size={20} strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="heading-section" style={{ fontSize: '18px', color: '#1e293b' }}>
                  Smart Order Preview
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <FileText size={16} strokeWidth={1.5} style={{ marginTop: '-1px' }} /> {batchId}
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--border-strong)' }}>•</span>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Clock size={16} strokeWidth={1.5} style={{ marginTop: '-1px' }} /> {new Intl.DateTimeFormat('en-GB', { timeStyle: 'short' }).format(new Date())}
                  </span>
                </div>
              </div>
            </div>
            
            {items.length > 0 && (
              <button
                onClick={clearAll}
                className="btn-ghost btn-press"
                style={{ padding: '8px', border: 'none', color: 'var(--text-muted)' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--status-critical)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                title="Clear all items"
              >
                <Trash2 size={20} strokeWidth={1.5} />
              </button>
            )}
          </div>

          {/* Data Density tags */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#f8fafc', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <Tag size={16} color="#64748b" strokeWidth={1.5} style={{ marginTop: '-1px' }} />
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>Supplier:</span>
            <span style={{ fontSize: '12px', color: '#475569', backgroundColor: '#e2e8f0', padding: '2px 8px', borderRadius: '999px', fontWeight: 500 }}>
              {activeSupplier}
            </span>
          </div>
        </div>

        {/* ── Table / Items List ── */}
        <div style={{
          flex: 1, overflowY: 'auto',
          display: 'flex', flexDirection: 'column',
          background: '#ffffff',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ position: 'sticky', top: 0, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(4px)', zIndex: 10, boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
              <tr>
                <th style={{ padding: '12px 24px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Product</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Qty</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Unit Price</th>
                <th style={{ padding: '12px 24px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Total</th>
                <th style={{ width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                // Skeleton / Empty State Row
                <tr>
                  <td colSpan={5} style={{ padding: '48px 24px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#94a3b8', gap: '12px' }}>
                      <PackageOpen size={24} strokeWidth={1.5} style={{ opacity: 0.5, transform: 'scale(1.5)' }} />
                      <div>
                        <p style={{ fontSize: '14px', fontWeight: 600, color: '#64748b', margin: 0 }}>Awaiting items</p>
                        <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>Submit via the form to build order.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="preview-slide-in" style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.2s' }}>
                    <td style={{ padding: '16px 24px', fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>
                      {item.name}
                    </td>
                    <td style={{ padding: '16px 16px', fontSize: '13px', color: '#475569', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {item.qty}
                    </td>
                    <td style={{ padding: '16px 16px', fontSize: '13px', color: '#475569', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {formatCurrency(item.cost)}
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '13px', fontWeight: 700, color: '#0f172a', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {formatCurrency(item.qty * item.cost)}
                    </td>
                    <td style={{ padding: '16px 8px', textAlign: 'right' }}>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="btn-press"
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: '#cbd5e1', padding: '6px', borderRadius: '6px',
                          display: 'flex', transition: 'all 150ms',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.color = '#ef4444';
                          e.currentTarget.style.background = '#fef2f2';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.color = '#cbd5e1';
                          e.currentTarget.style.background = 'none';
                        }}
                      >
                        <Trash2 size={16} strokeWidth={1.5} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Summary Footer ── */}
        <div className="preview-header" style={{
          padding: '24px', borderTop: '1px solid rgba(226, 232, 240, 0.8)',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
            }}>
              <div>
                 <p style={{
                   fontSize: '11px', fontWeight: 700, color: '#64748b',
                   textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0
                 }}>
                   Grand Total Cost
                 </p>
                 <p style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500, margin: '4px 0 0' }}>
                   {items.length} items to record
                 </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{
                  fontSize: '32px', fontWeight: 700, color: '#0f172a',
                  fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em',
                  lineHeight: 1,
                }}>
                  {formatCurrency(animatedTotal)}
                </span>
                <div style={{ fontSize: '11px', color: '#10b981', margin: '6px 0 0', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 0 2px rgba(16,185,129,0.2)' }} />
                  Values updated dynamically
                </div>
              </div>
            </div>

            <button
              onClick={handleCommit}
              disabled={items.length === 0 || isProcessing}
              className="btn-primary btn-press"
              style={{
                width: '100%', justifyContent: 'center',
                padding: '14px 24px', fontSize: '15px',
                background: items.length === 0 ? '#cbd5e1' : 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)',
                boxShadow: items.length === 0 ? 'none' : '0 4px 14px rgba(79, 70, 229, 0.3)',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                border: 'none',
              }}
            >
              {isProcessing ? (
                <>Stocking… <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /></>
              ) : (
                <>
                   Commit Stock Entry
                  <ArrowRight size={18} style={{ marginLeft: '4px' }} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
