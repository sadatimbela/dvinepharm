'use client';

import React, { useState, useEffect } from 'react';
import { X, Package, Barcode, ScanLine } from 'lucide-react';
import { useProductStore, Product } from '../store/useProductStore';
import { BarcodeScanner } from '@/components/ui/BarcodeScanner';
import { useAuth } from '@/hooks/useAuth';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
}

export function AddProductModal({ isOpen, onClose, product }: AddProductModalProps) {
  const { addProduct, updateProduct, updateStock } = useProductStore();
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: '',
    barcode: '',
    price: '',
    category: 'General',
    stock: '0',
    cost: '0'
  });

  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name,
        barcode: product.barcode,
        price: product.price.toString(),
        category: product.category || 'General',
        stock: product.stock.toString(),
        cost: (product as any).cost_price?.toString() || '0'
      });
    } else {
      setForm({ name: '', barcode: '', price: '', category: 'General', stock: '0', cost: '0' });
    }
  }, [product, isOpen]);
  
  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      name: form.name.trim(),
      barcode: form.barcode.trim(),
      price: parseInt(form.price) || 0,
      category: form.category,
    };

    if (product) {
      await updateProduct(product.id, payload);
      // If stock was changed in the edit modal, update it via the specialized method and log it
      const newStock = parseInt(form.stock) || 0;
      if (newStock !== product.stock && user) {
        await updateStock(product.id, newStock, { id: user.id || '', email: user.email || '' });
      }
    } else {
      // Create product first
      const success = await addProduct(payload);
      // Then set initial stock if provided
      if (success) {
        const initialStock = parseInt(form.stock) || 0;
        if (initialStock > 0 && user) {
           // We need the ID of the newly created product. 
           // addProduct currently fetches all, but we might need to find the new one by barcode.
           const { products } = useProductStore.getState();
           const newProd = products.find(p => p.barcode === payload.barcode);
           if (newProd) {
             await updateStock(newProd.id, initialStock, { id: user.id || '', email: user.email || '' });
           }
        }
      }
    }
    
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      <div
        style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0, 0, 0, 0.2)', backdropFilter: 'blur(2px)',
        }}
        onClick={onClose}
      />

      {/* Fluent Dialog Window (Acrylic & Layering) */}
      <div style={{
        position: 'relative', width: '100%', maxWidth: '520px',
        background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(32px) saturate(200%)',
        borderRadius: 'var(--r-lg)',
        border: '1px solid var(--border-strong)',
        borderTop: '1px solid rgba(255, 255, 255, 0.9)', 
        boxShadow: '0 32px 64px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <header style={{
          padding: '24px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: 38, height: 38, borderRadius: '10px',
              background: 'var(--accent-light)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              color: 'var(--accent)',
            }}>
              <Package size={20} strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="heading-section" style={{ fontSize: '18px' }}>
                {product ? 'Edit Product' : 'Add New Product'}
              </h2>
              <p className="text-meta" style={{ marginTop: '2px' }}>
                {product ? `Updating ${product.name}` : 'Register a new pharmaceutical entry in the catalogue.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-ghost"
            style={{ padding: '6px' }}
          >
            <X size={20} />
          </button>
        </header>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Product Name *
            </label>
            <input
              autoFocus
              required
              type="text"
              placeholder="e.g. Paracetamol 500mg"
              className="input-pharm"
              style={{ height: '42px' }}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div className="grid-dashboard-2" style={{ gap: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '-4px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Barcode / SKU
                </span>
                <button
                  type="button"
                  onClick={() => setIsScanning(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    background: 'transparent', border: 'none',
                    color: 'var(--accent)', fontSize: '12px', fontWeight: 700,
                    cursor: 'pointer', padding: '2px 6px', borderRadius: '4px',
                    transition: 'all 150ms'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-light)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <ScanLine size={14} strokeWidth={2} />
                  Initialize Scanner
                </button>
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}>
                  <Barcode size={16} strokeWidth={1.5} />
                </div>
                <input
                  type="text"
                  placeholder="Scan barcode or leave empty..."
                  className="input-pharm"
                  style={{ height: '42px', paddingLeft: '36px', fontFamily: 'var(--font-mono)' }}
                  value={form.barcode}
                  onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Unit Price (TZS) *
              </label>
              <input
                required
                type="number"
                placeholder="0"
                className="input-pharm"
                style={{ height: '42px', fontVariantNumeric: 'tabular-nums' }}
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </div>
          </div>

          <div className="grid-dashboard-2" style={{ gap: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Category
              </label>
              <select
                className="input-pharm"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                style={{ cursor: 'pointer', height: '42px' }}
              >
                <option value="General">General</option>
                <option value="Antibiotics">Antibiotics</option>
                <option value="Analgesics">Analgesics</option>
                <option value="Antidiabetics">Antidiabetics</option>
                <option value="Supplements">Supplements</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Stock Level
              </label>
              <input
                type="number"
                placeholder="0"
                className="input-pharm"
                style={{ height: '42px', fontVariantNumeric: 'tabular-nums' }}
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
              />
            </div>
          </div>

          {/* Actions */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            marginTop: '8px', paddingTop: '24px', borderTop: '1px solid var(--border)',
          }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              style={{ flex: 1, justifyContent: 'center', padding: '10px 16px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              style={{ flex: 1, justifyContent: 'center', padding: '10px 16px' }}
            >
              {product ? 'Update Details' : 'Save Product'}
            </button>
          </div>
        </form>

        <BarcodeScanner 
          isOpen={isScanning}
          onClose={() => setIsScanning(false)}
          onScanSuccess={(code) => {
            setForm({ ...form, barcode: code });
            setIsScanning(false);
          }}
          onScanError={(err) => console.error('Scan error:', err)}
        />
      </div>
    </div>
  );
}
