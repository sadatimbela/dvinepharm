'use client';

import React from 'react';
import { ProductInputSection } from '@/modules/pos/components/ProductInputSection';
import { CartPanel } from '@/modules/pos/components/CartPanel';
import { Clock, ShoppingCart } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';

export default function POSPage() {
  const now = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <div style={{ maxWidth: '1320px', margin: '0 auto', display: 'flex', flexDirection: 'column' }}>

      {/* -- Page Header -- */}
      <PageHeader 
        title="Point of Sale"
        subtitle="Scan a barcode or search the catalogue to begin a transaction."
        icon={<ShoppingCart />}
        iconBg="linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)"
        iconColor="#16a34a"
        actions={
          <div
            aria-label={`Current time: ${now}`}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              fontSize: '13px', color: 'var(--text-muted)',
              fontWeight: 500,
              background: 'var(--bg-card)', padding: '6px 12px',
              borderRadius: 'var(--r-sm)', border: '1px solid var(--border-strong)',
              boxShadow: 'var(--shadow-xs)'
            }}
          >
            <Clock size={14} strokeWidth={1.5} aria-hidden="true" />
            <span aria-hidden="true">{now}</span>
          </div>
        }
      />

      {/* -- Two-column layout, stacks vertically on mobile -- */}
      <div className="grid-responsive-2-1 pos-layout" style={{ marginTop: '32px' }}>
        <ProductInputSection />
        <CartPanel />
      </div>
    </div>
  );
}

