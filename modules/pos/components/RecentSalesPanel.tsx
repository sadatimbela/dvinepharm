'use client';

import React, { useState } from 'react';
import { Zap, ChevronDown, Clock } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/utils/db';
import { formatCurrency } from '@/utils/currency';
import { useSettingsStore } from '@/stores/useSettingsStore';

export function RecentSalesPanel() {
  const [isExpanded, setIsExpanded] = useState(false);
  const { currency } = useSettingsStore();
  
  const recentSales = useLiveQuery(async () => {
    const today = new Date().toISOString().split('T')[0];
    return db.sales
      .where('created_at')
      .aboveOrEqual(today)
      .reverse()
      .limit(10)
      .toArray();
  }, []) || [];

  if (recentSales.length === 0) return null;

  return (
    <div style={{ marginTop: '24px' }}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: isExpanded ? '12px 12px 0 0' : '12px',
          cursor: 'pointer',
          transition: 'all 200ms ease',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: 32, height: 32, borderRadius: '8px',
            background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Clock size={16} strokeWidth={2} />
          </div>
          <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Recent Transactions
            <span style={{ marginLeft: '8px', fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)', textTransform: 'none', letterSpacing: 0 }}>
              (Today)
            </span>
          </h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', background: 'var(--bg-base)', padding: '2px 8px', borderRadius: '99px' }}>
            {recentSales.length}
          </span>
          <ChevronDown 
            size={18} 
            style={{ 
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)', 
              transition: 'transform 250ms cubic-bezier(0.2, 0, 0, 1)',
              color: 'var(--text-muted)'
            }} 
          />
        </div>
      </button>

      {isExpanded && (
        <div style={{
          background: '#fff',
          border: '1px solid var(--border)',
          borderTop: 'none',
          borderRadius: '0 0 12px 12px',
          overflow: 'hidden',
          animation: 'slideDown 300ms cubic-bezier(0.2, 0, 0, 1)'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {recentSales.map((sale, idx) => (
              <div 
                key={sale.localId || sale.id}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 20px', 
                  borderBottom: idx === recentSales.length - 1 ? 'none' : '1px solid var(--border-strong)',
                  fontSize: '14px',
                  transition: 'background 150ms',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-base)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ 
                    width: 34, height: 34, borderRadius: '8px', 
                    background: 'var(--status-success-bg)', color: 'var(--status-success)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center' 
                  }}>
                    <Zap size={16} />
                  </div>
                  <div>
                    <p style={{ fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
                      TXN-{sale.id?.substring(0, 8).toUpperCase() || sale.localId?.substring(0, 8).toUpperCase()}
                    </p>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                      {new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontWeight: 700, margin: 0, color: 'var(--text-primary)', fontSize: '15px' }}>
                    {formatCurrency(sale.total_amount, currency)}
                  </p>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                    {sale.items?.length || 0} items
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
