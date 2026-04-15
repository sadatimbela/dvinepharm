'use client';

import React from 'react';
import { useInventoryStore, getStatus, StockStatus, InventoryItem } from '../store/useInventoryStore';
import { Package, MoreVertical, Loader2, Edit2, Trash2 } from 'lucide-react';

interface InventoryTableProps {
  search?: string;
  onEdit?: (item: InventoryItem) => void;
  onDelete?: (id: string) => void;
}

export function InventoryTable({ search = '', onEdit, onDelete }: InventoryTableProps) {
  const { items, isLoading } = useInventoryStore();

  // Filter
  const filtered = search
    ? items.filter(i =>
        i.name.toLowerCase().includes(search.toLowerCase()) ||
        i.sku?.toLowerCase().includes(search.toLowerCase()) ||
        i.category?.toLowerCase().includes(search.toLowerCase())
      )
    : items;

  const getStatusBadge = (status: StockStatus) => {
    switch (status) {
      case 'Out of Stock': return { cls: 'badge badge-red',   dot: 'var(--status-critical)' };
      case 'Low Stock':    return { cls: 'badge badge-amber', dot: 'var(--status-warning)'  };
      default:             return { cls: 'badge badge-green', dot: 'var(--status-success)'  };
    }
  };

  const isNearExpiry = (expiry: string) => {
    if (!expiry || expiry === 'N/A') return false;
    const diff = Math.ceil((new Date(expiry).getTime() - Date.now()) / 86400000);
    return diff <= 90 && diff > 0;
  };
  const isExpired = (expiry: string) => {
    if (!expiry || expiry === 'N/A') return false;
    return new Date(expiry) < new Date();
  };

  if (isLoading) {
    return (
      <div className="card-pharm" style={{ width: '100%', padding: '48px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', color: 'var(--text-muted)' }}>
        <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
        <span>Loading inventory...</span>
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="card-pharm" style={{ width: '100%' }}>
        <div className="empty-state">
          <div className="empty-state-icon">
            <Package size={22} strokeWidth={1.5} />
          </div>
          <p className="empty-state-title">
            {search ? 'No items match your search' : 'No inventory data available'}
          </p>
          <p className="empty-state-desc">
            {search
              ? `Try searching by a different name, SKU, or category.`
              : `Admin, please add stock through the Procurement module. Items will appear here once received.`}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card-pharm" style={{ overflow: 'hidden' }}>
      <div className="table-scroll">
        <table className="table-pharm">
          <thead>
            <tr>
              <th>Drug Name</th>
              <th>SKU / Barcode</th>
              <th>Category</th>
              <th style={{ textAlign: 'right' }}>Stock</th>
              <th>Expiry Date</th>
              <th>Status</th>
              <th style={{ width: '48px' }}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => {
              const status    = getStatus(item);
              const badge     = getStatusBadge(status);
              const expired   = isExpired(item.expiry);
              const nearExpiry= isNearExpiry(item.expiry);

              return (
                <tr key={item.id}>
                  {/* Drug Name */}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: '6px',
                        background: 'var(--accent-light)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--accent)', flexShrink: 0,
                      }}>
                        <Package size={14} strokeWidth={1.5} />
                      </div>
                      <span style={{ fontWeight: 500 }}>{item.name}</span>
                    </div>
                  </td>

                  {/* SKU */}
                  <td>
                    <code style={{
                      fontSize: '12px', color: 'var(--text-secondary)',
                      background: 'var(--bg-base)', padding: '2px 7px',
                      borderRadius: '4px', fontFamily: 'var(--font-mono)',
                      border: '1px solid var(--border)',
                      letterSpacing: '0.04em',
                    }}>
                      {item.sku}
                    </code>
                  </td>

                  {/* Category */}
                  <td>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {item.category}
                    </span>
                  </td>

                  {/* Stock Level */}
                  <td style={{ textAlign: 'right' }}>
                    <span style={{
                      fontWeight: 600, fontVariantNumeric: 'tabular-nums',
                      color: status === 'Out of Stock' ? 'var(--status-critical)'
                           : status === 'Low Stock'   ? 'var(--status-warning)'
                           : 'var(--text-primary)',
                    }}>
                      {item.stock}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '3px' }}>
                      u
                    </span>
                  </td>

                  {/* Expiry Date */}
                  <td>
                    <span style={{
                      fontSize: '13px',
                      fontWeight: expired || nearExpiry ? 500 : 400,
                      color: expired   ? 'var(--status-critical)'
                           : nearExpiry ? 'var(--status-warning)'
                           : 'var(--text-secondary)',
                    }}>
                      {expired ? `${item.expiry} — Expired` : item.expiry}
                    </span>
                  </td>

                  {/* Status Badge */}
                  <td>
                    <span className={badge.cls}>
                      <span style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: badge.dot, marginRight: '6px',
                        display: 'inline-block', flexShrink: 0,
                      }} />
                      {status}
                    </span>
                  </td>

                  {/* Actions */}
                  <td>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                      <button
                        className="btn-ghost"
                        style={{ padding: '6px', color: 'var(--text-muted)' }}
                        onClick={() => onEdit?.(item)}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        className="btn-ghost"
                        style={{ padding: '6px', color: 'var(--text-muted)' }}
                        onClick={() => onDelete?.(item.id)}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--status-critical)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function InlineAction({ children }: { children: React.ReactNode }) {
  const [h, setH] = React.useState(false);
  return (
    <button
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        background: h ? 'var(--accent-light)' : 'none',
        border: 'none', cursor: 'pointer',
        color: h ? 'var(--accent)' : 'var(--text-muted)',
        padding: '5px', borderRadius: '5px',
        display: 'flex', transition: 'background 140ms, color 140ms',
      }}
    >
      {children}
    </button>
  );
}
