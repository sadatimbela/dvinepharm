'use client';

import React, { useState } from 'react';
import { ProductTable } from '@/modules/products/components/ProductTable';
import { AddProductModal } from '@/modules/products/components/AddProductModal';
import { Plus, Download, Filter, Search, Package } from 'lucide-react';
import { useProductStore } from '@/modules/products/store/useProductStore';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { PageHeader } from '@/components/ui/PageHeader';

export default function ProductsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { products, isLoading, fetchProducts } = useProductStore();

  React.useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <div style={{
      maxWidth: '1320px', margin: '0 auto',
      display: 'flex', flexDirection: 'column',
    }}>

      {/* ── Page Header ── */}
      <PageHeader 
        title="Products"
        subtitle="Manage your pharmacy's drug catalogue, pricing, and barcodes."
        icon={<Package />}
        iconBg="linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)"
        iconColor="#4f46e5"
        actions={
          <>
            <button className="btn-secondary">
              <Download size={16} strokeWidth={1.5} style={{ marginRight: '6px' }} />
              Export
            </button>
            <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
              <Plus size={16} strokeWidth={2} style={{ marginRight: '6px' }} />
              Add Product
            </button>
          </>
        }
      />

      {/* ── Toolbar ── 32px below header */}
      <div style={{
        marginTop: '32px',
        display: 'flex', alignItems: 'center', gap: '8px',
      }}>
        {/* Search — largest flex element, left-anchored */}
        <div style={{ position: 'relative', flex: '1', maxWidth: '420px' }}>
          <div style={{
            position: 'absolute', left: '11px', top: '50%',
            transform: 'translateY(-50%)', color: 'var(--text-muted)',
            pointerEvents: 'none',
          }}>
            <Search size={15} strokeWidth={1.5} />
          </div>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, category, or barcode…"
            className="input-pharm"
            style={{ paddingLeft: '34px', height: '38px' }}
          />
        </div>

        {/* Push secondary actions to the right — large visual gap */}
        <div style={{ flex: 1 }} />

        {/* Divider — visual grouping cue */}
        <div className="toolbar-divider" />

        <button className="btn-secondary" style={{ height: '38px' }}>
          <Filter size={15} strokeWidth={1.5} />
          Filters
        </button>

        {/* Product count — metadata, separated by gap from buttons */}
        <span style={{
          fontSize: '13px', color: 'var(--text-muted)',
          fontVariantNumeric: 'tabular-nums', minWidth: '60px', textAlign: 'right',
        }}>
          {products.length} item{products.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Table — 32px below toolbar ── */}
      <div style={{ marginTop: '32px' }}>
        {isLoading ? <TableSkeleton rows={8} columns={6} /> : <ProductTable search={search} />}
      </div>

      {/* ── Modal ── */}
      <AddProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
