'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Barcode, Search, Package, Plus, Camera, X, ZapOff, ScanText, Info, ChevronDown, Zap } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { formatCurrency } from '@/utils/currency';
import { useProductStore } from '@/modules/products/store/useProductStore';
import { BarcodeScanner } from '@/components/ui/BarcodeScanner';
import { useAppStore } from '@/stores/useAppStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/utils/db';

// Point of Sale - Product Input and Scanning
export function ProductInputSection() {
  const [barcode, setBarcode] = useState('');
  const [search, setSearch] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const [isInventoryExpanded, setIsInventoryExpanded] = useState(false);

  const addItem = useCartStore((s) => s.addItem);
  const { products, fetchProducts, isLoading } = useProductStore();
  const enablePOSScanner = useAppStore((s) => s.enablePOSScanner);
  const { currency } = useSettingsStore();
  
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // focus appropriate input and load products on mount
  useEffect(() => {
    if (enablePOSScanner) {
      barcodeInputRef.current?.focus();
    } else {
      searchInputRef.current?.focus();
    }
    fetchProducts();
  }, [fetchProducts, enablePOSScanner]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input other than what we want, unless it's a hotkey
      if ((e.key === 'F3') || (e.key === '/' && document.activeElement !== searchInputRef.current && document.activeElement !== barcodeInputRef.current)) {
        e.preventDefault();
        if (enablePOSScanner) {
           barcodeInputRef.current?.focus();
        } else {
           searchInputRef.current?.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enablePOSScanner]);

  const handleAddItem = useCallback((product: any) => {
    addItem({ id: product.id, name: product.name, price: product.price, barcode: product.barcode });
    // refocus immediately after adding
    setTimeout(() => {
      // Clear manual search if that was used
      if (!enablePOSScanner && search) {
        setSearch('');
      }
      if (enablePOSScanner) {
        barcodeInputRef.current?.focus();
      } else {
        searchInputRef.current?.focus();
      }
    }, 10);
  }, [addItem, enablePOSScanner, search]);

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const product = products.find((p) => p.barcode === barcode);
    if (product) {
      handleAddItem(product);
      setBarcode('');
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Treat exact barcode typed into search as a scan if they press enter
    if (e.key === 'Enter' && search.trim()) {
      const product = products.find((p) => p.barcode === search.trim());
      if (product) {
        handleAddItem(product);
      }
    }
  };

  const onScanSuccess = (decodedText: string) => {
    const product = products.find((p) => p.barcode === decodedText);
    if (product) {
      handleAddItem(product);
    } else {
      setScanError(`Product not found for barcode: ${decodedText}`);
      setTimeout(() => setScanError(''), 3000);
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.barcode?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* -- Barcode & Search Controls -- */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {enablePOSScanner && (
          <form onSubmit={handleBarcodeSubmit}>
            <label htmlFor="barcode-input" className="sr-only">Scan or type product barcode</label>
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)',
                color: 'var(--accent)',
              }} aria-hidden="true">
                <Barcode size={20} strokeWidth={1.5} />
              </div>
              <input
                id="barcode-input"
                ref={barcodeInputRef}
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="Scan or type barcode…"
                className="input-pharm"
                aria-label="Product barcode"
                style={{
                  paddingLeft: '48px', height: '56px',
                  fontSize: '18px', fontWeight: 600,
                  borderWidth: '2px', borderColor: 'var(--accent-mid)',
                  background: 'var(--accent-light)',
                }}
              />
            </div>
          </form>
        )}

        <div style={{ position: 'relative', width: '100%' }}>
          <button
            onClick={() => { if (enablePOSScanner) setIsScanning(true); }}
            aria-label="Initialize barcode scanner camera"
            title={!enablePOSScanner ? "Barcode scanner is temporarily inactive" : ""}
            disabled={!enablePOSScanner}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '9px',
              width: '100%', padding: '13px 0',
              background: 'linear-gradient(135deg, #0D1B2A 0%, #1E293B 100%)',
              color: '#E2E8F0',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '10px',
              fontSize: '14px', fontWeight: 600, letterSpacing: '0.01em',
              cursor: !enablePOSScanner ? 'not-allowed' : 'pointer',
              opacity: !enablePOSScanner ? 0.6 : 1,
              boxShadow: '0 4px 16px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.06)',
              transition: 'all 180ms cubic-bezier(0.2,0,0,1)',
              minHeight: 48,
            }}
            onMouseEnter={e => {
              if (enablePOSScanner) {
                e.currentTarget.style.background = 'linear-gradient(135deg, #172032 0%, #243347 100%)';
                e.currentTarget.style.color = '#fff';
                e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.09)';
              }
            }}
            onMouseLeave={e => {
              if (enablePOSScanner) {
                e.currentTarget.style.background = 'linear-gradient(135deg, #0D1B2A 0%, #1E293B 100%)';
                e.currentTarget.style.color = '#E2E8F0';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.06)';
              }
            }}
            onMouseDown={e => { if (enablePOSScanner) e.currentTarget.style.transform = 'scale(0.984)'; }}
            onMouseUp={e => { if (enablePOSScanner) e.currentTarget.style.transform = 'scale(1)'; }}
          >
            {enablePOSScanner ? <ScanText size={17} strokeWidth={1.8} aria-hidden="true" /> : <Info size={17} strokeWidth={1.8} />}
            {enablePOSScanner ? "Initialize Scanner" : "Scanner is currently disabled"}
          </button>
        </div>

        {/* Barcode Scanner Modal */}
        <BarcodeScanner
          isOpen={isScanning}
          onClose={() => setIsScanning(false)}
          onScanSuccess={onScanSuccess}
          onScanError={(err) => console.log('Scan error:', err)}
        />

        {scanError && (
          <div style={{
            padding: '10px 14px',
            borderRadius: '8px',
            background: 'var(--status-critical-bg)',
            border: '1px solid rgba(220,38,38,0.2)',
            color: 'var(--status-critical)',
            fontSize: '13px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <ZapOff size={14} />
            {scanError}
          </div>
        )}

        <div style={{ position: 'relative' }}>
          <label htmlFor="product-search" className="sr-only">Search product catalogue</label>
          <div style={{
            position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
            color: 'var(--text-muted)',
          }} aria-hidden="true">
            <Search size={16} strokeWidth={1.5} />
          </div>
          <input
            id="product-search"
            ref={searchInputRef}
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder={enablePOSScanner ? "Search catalogue manually…" : "Search by product name or SKU (Press '/' to focus)"}
            className="input-pharm"
            style={{ 
              paddingLeft: '42px', 
              height: !enablePOSScanner ? '56px' : '42px', 
              fontSize: !enablePOSScanner ? '16px' : '14px',
              borderWidth: !enablePOSScanner ? '2px' : '1px',
              borderColor: !enablePOSScanner ? 'var(--accent-mid)' : 'var(--border-strong)'
            }}
          />
        </div>
      </div>

      {/* ── Product List Area ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div 
          onClick={() => setIsInventoryExpanded(!isInventoryExpanded)}
          style={{ 
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
            padding: '8px 12px', background: 'var(--bg-base)', borderRadius: '8px',
            cursor: 'pointer', userSelect: 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 className="text-label" style={{ fontSize: '12px', margin: 0 }}>Available Inventory</h3>
            <span className="text-meta" style={{ fontSize: '11px' }}>{filteredProducts.length} items</span>
          </div>
          <ChevronDown 
            size={16} 
            style={{ 
              transform: isInventoryExpanded ? 'rotate(180deg)' : 'rotate(0)', 
              transition: 'transform 200ms',
              color: 'var(--text-muted)'
            }} 
          />
        </div>

        {isInventoryExpanded && (
          <div className="grid-dashboard-2 grid-pos-products" style={{
            overflowY: 'auto', maxHeight: 'calc(100vh - 450px)',
            padding: '4px',
            animation: 'slideDown 200ms ease'
          }}>
            {filteredProducts.length === 0 && !isLoading && (
              <div style={{
                gridColumn: 'span 2', textAlign: 'center',
                padding: '48px 24px', color: 'var(--text-muted)',
                border: '1px dashed var(--border-strong)', borderRadius: '12px',
              }}>
                <Package size={24} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                <p className="text-subtitle" style={{ fontSize: '14px' }}>No products found</p>
              </div>
            )}

            {isLoading && [1,2,3,4].map(i => (
              <div key={i} className="skeleton" style={{ height: '72px', borderRadius: '10px' }} />
            ))}

            {filteredProducts.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onAdd={() => handleAddItem(p)}
              />
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse   { 0% { opacity:1 } 50% { opacity:0.4 } 100% { opacity:1 } }
        @keyframes fadeIn  { from { opacity:0 } to { opacity:1 } }
        @keyframes slideUp   { from { opacity:0; transform:translateY(14px) scale(0.98) } to { opacity:1; transform:translateY(0) scale(1) } }
        @keyframes slideDown { from { opacity:0; transform:translateY(-10px) } to { opacity:1; transform:translateY(0) } }
      `}</style>
    </div>
  );
}

function ProductCard({ product, onAdd }: { product: any; onAdd: () => void }) {
  const [h, setH] = useState(false);
  return (
    <button
      onClick={onAdd}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      className="card-pharm"
      aria-label={`Add ${product.name} to cart — ${Math.round(product.price).toLocaleString()} TZS, ${product.stock} in stock`}
      style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '14px', textAlign: 'left',
        cursor: 'pointer',
        borderColor: h ? 'var(--accent)' : 'var(--border-strong)',
        background: h ? 'var(--accent-light)' : '#fff',
        transition: 'all 140ms ease',
        position: 'relative',
      }}
    >
      <div aria-hidden="true" style={{
        width: 34, height: 34, borderRadius: '8px',
        background: h ? '#fff' : 'var(--bg-base)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: h ? 'var(--accent)' : 'var(--text-secondary)',
        flexShrink: 0,
        border: h ? '1px solid var(--accent-mid)' : 'none',
      }}>
        {h ? <Plus size={18} strokeWidth={2} /> : <Package size={16} strokeWidth={1.5} />}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p aria-hidden="true" style={{
          fontWeight: 600, color: 'var(--text-primary)', fontSize: '14px',
          margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {product.name}
        </p>
        <div aria-hidden="true" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            fontSize: '11px', color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
          }}>
            {product.barcode?.substring(0, 10)}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>•</span>
          <span style={{
            fontSize: '11px', fontWeight: 600,
            color: product.stock < 10 ? 'var(--status-critical)' : 'var(--text-muted)'
          }}>
            {product.stock} in stock
          </span>
        </div>
      </div>

      <div aria-hidden="true" style={{ textAlign: 'right', flexShrink: 0 }}>
        <p style={{
          fontWeight: 700,
          color: h ? 'var(--accent)' : 'var(--text-primary)',
          fontSize: '14px', margin: 0, fontVariantNumeric: 'tabular-nums',
        }}>
          {Math.round(product.price).toLocaleString()}
        </p>
      </div>
    </button>
  );
}

