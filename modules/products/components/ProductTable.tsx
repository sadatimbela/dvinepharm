'use client';

import React, { useState } from 'react';
import { useProductStore, Product } from '../store/useProductStore';
import { Package, Trash2, Edit2, AlertTriangle, X, Loader2, RefreshCw } from 'lucide-react';
import { formatCurrency } from '@/utils/currency';
import { AddProductModal } from './AddProductModal';
import { useAuth } from '@/hooks/useAuth';

interface ProductTableProps {
  search?: string;
}

export function ProductTable({ search = '' }: ProductTableProps) {
  const { products, deleteProduct, updateStock, isLoading } = useProductStore();
  const { user } = useAuth();
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [productToUpdateStock, setProductToUpdateStock] = useState<Product | null>(null);
  const [newStockValue, setNewStockValue] = useState<string>('');
  const [isUpdatingStock, setIsUpdatingStock] = useState(false);

  const filtered = search
    ? products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.barcode?.toLowerCase().includes(search.toLowerCase()) ||
        p.category?.toLowerCase().includes(search.toLowerCase())
      )
    : products;

  const confirmDelete = () => {
    if (productToDelete) {
      deleteProduct(productToDelete);
      setProductToDelete(null);
    }
  };

  return (
    <>
      <div className="card-pharm" style={{ overflow: 'hidden' }}>
        <div className="table-scroll">
          {isLoading ? (
            <div style={{ padding: '48px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', color: 'var(--text-muted)' }}>
              <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
              <span>Loading products...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <Package size={22} strokeWidth={1.5} />
              </div>
              <p className="empty-state-title">
                {search ? 'No products match your search' : 'No products yet'}
              </p>
              <p className="empty-state-desc">
                {search
                  ? `Try a different name, barcode, or category.`
                  : `Please click "Add Product" to register your first drug in the catalogue. As an admin, keeping the catalogue updated is crucial!`}
              </p>
            </div>
          ) : (
            <table className="table-pharm">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>SKU / Barcode</th>
                  <th style={{ textAlign: 'right' }}>Price (TZS)</th>
                  <th style={{ textAlign: 'right' }}>Stock</th>
                  <th>Category</th>
                  <th style={{ width: '72px' }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: 30, height: 30, borderRadius: '6px',
                          background: 'var(--accent-light)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'var(--accent)', flexShrink: 0,
                        }}>
                          <Package size={15} strokeWidth={1.5} />
                        </div>
                        <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                          {p.name}
                        </span>
                      </div>
                    </td>

                    <td>
                      <code style={{
                        fontSize: '12px', color: 'var(--text-secondary)',
                        background: 'var(--bg-base)', padding: '2px 7px',
                        borderRadius: '4px', fontFamily: 'var(--font-mono)',
                        border: '1px solid var(--border)',
                        letterSpacing: '0.04em',
                      }}>
                        {p.barcode}
                      </code>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <span style={{
                        fontWeight: 500, fontVariantNumeric: 'tabular-nums',
                        color: 'var(--text-primary)',
                      }}>
                        {Math.round(p.price).toLocaleString('en-US')}
                      </span>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'flex-end', gap: '6px',
                      }}>
                        <span style={{
                          width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                          background: p.stock === 0
                            ? 'var(--status-critical)'
                            : p.stock < 50
                            ? 'var(--status-warning)'
                            : 'var(--status-success)',
                        }} />
                        <span style={{
                          fontWeight: 500, fontVariantNumeric: 'tabular-nums',
                          color: p.stock === 0
                            ? 'var(--status-critical)'
                            : p.stock < 50
                            ? 'var(--status-warning)'
                            : 'var(--text-primary)',
                        }}>
                          {p.stock}
                        </span>
                      </div>
                    </td>

                    <td>
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                        {p.category || 'General'}
                      </span>
                    </td>

                    <td>
                      <div style={{
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'flex-end', gap: '2px',
                      }}>
                        <ActionButton 
                          disabled={isUpdatingStock}
                          title="Update Stock" 
                          onClick={() => {
                            setProductToUpdateStock(p);
                            setNewStockValue(p.stock.toString());
                          }}
                        >
                          <RefreshCw size={13} strokeWidth={1.5} style={{ animation: isUpdatingStock && productToUpdateStock?.id === p.id ? 'spin 1s linear infinite' : 'none' }} />
                        </ActionButton>
                        <ActionButton disabled={isUpdatingStock} title="Edit" onClick={() => setProductToEdit(p)}>
                          <Edit2 size={13} strokeWidth={1.5} />
                        </ActionButton>
                        <ActionButton
                          disabled={isUpdatingStock}
                          title="Delete"
                          onClick={() => setProductToDelete(p.id)}
                          danger
                        >
                          <Trash2 size={13} strokeWidth={1.5} />
                        </ActionButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Edit Product Modal ── */}
      <AddProductModal 
        isOpen={!!productToEdit}
        onClose={() => setProductToEdit(null)}
        product={productToEdit}
      />

      {/* ── Stock Update Modal ── */}
      {productToUpdateStock && (
        <div className="modal-overlay" onClick={() => !isUpdatingStock && setProductToUpdateStock(null)}>
          <div className="modal" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="heading-section" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <RefreshCw size={18} />
                Update Stock Level
              </h2>
              <button onClick={() => !isUpdatingStock && setProductToUpdateStock(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!user) return;
              setIsUpdatingStock(true);
              const success = await updateStock(productToUpdateStock.id, parseInt(newStockValue) || 0, { id: user.id || '', email: user.email || '' });
              setIsUpdatingStock(false);
              if (success) setProductToUpdateStock(null);
            }}>
              <div className="modal-body">
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  Updating stock for <strong>{productToUpdateStock.name}</strong>.
                </p>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
                  New Stock Quantity
                </label>
                <input
                  type="number"
                  autoFocus
                  className="input-pharm"
                  value={newStockValue}
                  onChange={e => setNewStockValue(e.target.value)}
                  disabled={isUpdatingStock}
                  style={{ fontSize: '18px', fontWeight: 700, textAlign: 'center' }}
                />
              </div>
              
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setProductToUpdateStock(null)}
                  disabled={isUpdatingStock}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={isUpdatingStock}
                >
                  {isUpdatingStock ? 'Updating...' : 'Save Stock Level'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {productToDelete && (
        <div className="modal-overlay" onClick={() => setProductToDelete(null)}>
          <div className="modal" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="heading-section" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: 'var(--status-critical)', display: 'flex' }}><AlertTriangle size={18} /></span>
                Confirm Deletion
              </h2>
              <button onClick={() => setProductToDelete(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body">
              <p className="text-body" style={{ margin: 0 }}>
                Are you sure you want to delete this product? This action cannot be undone and will remove it from the catalogue permanently.
              </p>
            </div>
            
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => setProductToDelete(null)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn-danger" 
                onClick={confirmDelete}
              >
                Delete Product
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ── Small icon-button with hover feedback ── */
function ActionButton({
  children, title, onClick, danger, disabled
}: {
  children: React.ReactNode;
  title?: string;
  onClick?: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <button
      onClick={disabled ? undefined : onClick}
      title={title}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: (hovered && !disabled)
          ? danger ? 'var(--status-critical-bg)' : 'var(--accent-light)'
          : 'none',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        color: (hovered && !disabled)
          ? danger ? 'var(--status-critical)' : 'var(--accent)'
          : 'var(--text-muted)',
        padding: '6px',
        borderRadius: '5px',
        display: 'flex',
        transition: 'background 140ms, color 140ms',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {children}
    </button>
  );
}
