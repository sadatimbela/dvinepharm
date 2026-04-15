'use client';

import React from 'react';
import { InventoryTable } from '@/modules/inventory/components/InventoryTable';
import { AddInventoryModal } from '@/modules/inventory/components/AddInventoryModal';
import { Search, Filter, Download, Layers, Plus, AlertTriangle, Package, ClipboardList, Boxes, PackageX, TrendingDown } from 'lucide-react';
import { MetricCardSkeleton, TableSkeleton } from '@/components/ui/Skeleton';
import { DashboardCard, DashboardCardStyles } from '@/components/ui/DashboardCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { useInventoryStore, getStatus, InventoryItem } from '@/modules/inventory/store/useInventoryStore';
import { useAuth } from '@/hooks/useAuth';

export default function InventoryPage() {
  const { items, isLoading, fetchInventory, deleteItem } = useInventoryStore();
  const { role } = useAuth();
  const [search, setSearch] = React.useState('');
  const [showModal, setShowModal] = React.useState(false);
  const [itemToEdit, setItemToEdit] = React.useState<InventoryItem | null>(null);
  const [itemToDelete, setItemToDelete] = React.useState<string | null>(null);

  const lowStock   = items.filter(i => getStatus(i) === 'Low Stock').length;
  const outOfStock = items.filter(i => getStatus(i) === 'Out of Stock').length;
  const inStock    = items.filter(i => getStatus(i) === 'In Stock').length;

  React.useEffect(() => { fetchInventory(); }, [fetchInventory]);

  const handleDelete = async () => {
    if (itemToDelete) {
      try {
        await deleteItem(itemToDelete);
        setItemToDelete(null);
      } catch (err) {
        alert('Failed to delete item. Please try again.');
      }
    }
  };

  return (
    <div className="pb-24 md:pb-0" style={{ maxWidth: '1320px', margin: '0 auto', display: 'flex', flexDirection: 'column' }}>
      <DashboardCardStyles />

      {/* ── Page Header ── */}
      <PageHeader 
        title="Inventory Control"
        subtitle="Monitor real-time stock levels, track expiry dates, and manage reorder points."
        icon={<ClipboardList />}
        iconBg="linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)"
        iconColor="#0284c7"
        actions={
          <>
            <button className="btn-secondary">
              <Download size={16} strokeWidth={1.5} style={{ marginRight: '6px' }} />
              Export
            </button>
            <button className="btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={16} strokeWidth={2} style={{ marginRight: '6px' }} />
              Add Item
            </button>
          </>
        }
      />

      {/* ── Add/Edit Item Modal ── */}
      {(showModal || itemToEdit) && (
        <AddInventoryModal 
          onClose={() => { setShowModal(false); setItemToEdit(null); }} 
          item={itemToEdit}
        />
      )}

      {/* ── Metric Cards ── */}
      <div style={{ marginTop: '32px' }}>
        {isLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            <MetricCardSkeleton /><MetricCardSkeleton /><MetricCardSkeleton /><MetricCardSkeleton />
          </div>
        ) : (
          <div className="grid-dashboard-4">
            <DashboardCard
              variant="operational"
              label="Total Items"
              value={items.length}
              sub="across all categories"
              icon={<Boxes size={20} strokeWidth={1.5} />}
              iconBg="var(--accent-light)"
              iconColor="var(--accent)"
              delay={0}
            />
            <DashboardCard
              variant="informational"
              label="In Stock"
              value={inStock}
              sub="available items"
              icon={<Layers size={20} strokeWidth={1.5} />}
              iconBg="var(--status-success-bg)"
              iconColor="var(--status-success)"
              delay={80}
            />
            <DashboardCard
              variant={lowStock > 0 ? 'critical' : 'informational'}
              label="Low Stock"
              value={lowStock}
              sub="below reorder level"
              icon={<TrendingDown size={20} strokeWidth={1.5} />}
              iconBg="var(--status-warning-bg)"
              iconColor="var(--status-warning)"
              delay={160}
            />
            <DashboardCard
              variant={outOfStock > 0 ? 'critical' : 'informational'}
              label="Out of Stock"
              value={outOfStock}
              sub="needs immediate action"
              icon={<PackageX size={20} strokeWidth={1.5} />}
              iconBg="var(--status-critical-bg)"
              iconColor="var(--status-critical)"
              delay={240}
            />
          </div>
        )}
      </div>

      {/* ── Table ── */}
      <div style={{ marginTop: '32px' }}>
        {isLoading
          ? <TableSkeleton rows={8} columns={6} />
          : <InventoryTable 
              search={search} 
              onEdit={(item) => setItemToEdit(item)}
              onDelete={(id) => setItemToDelete(id)}
            />
        }
      </div>

      {/* ── Delete Confirmation ── */}
      {itemToDelete && (
        <div 
          onClick={() => setItemToDelete(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 300,
            background: 'rgba(0,0,0,0.5)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', padding: '24px'
          }}
        >
          <div 
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: '400px', background: 'white',
              borderRadius: 'var(--r-md)', padding: '24px',
              boxShadow: 'var(--shadow-lg)'
            }}
          >
            <h3 style={{ margin: '0 0 12px', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle color="var(--status-critical)" /> Confirm Delete
            </h3>
            <p style={{ margin: '0 0 24px', color: 'var(--text-secondary)', fontSize: '14px' }}>
              Are you sure you want to remove this item from the inventory registry?
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setItemToDelete(null)}>Cancel</button>
              <button className="btn-danger" style={{ flex: 1 }} onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Legend ── */}
      {!isLoading && (
        <div style={{
          marginTop: '24px',
          display: 'flex', alignItems: 'center', gap: '20px',
          padding: '10px 16px',
          border: '1px solid var(--border-strong)',
          borderRadius: 'var(--r-md)',
          background: 'var(--bg-card)',
        }}>
          <span className="text-label">Status</span>
          <LegendDot color="var(--status-success)" label="In Stock" />
          <LegendDot color="var(--status-warning)" label="Low Stock" />
          <LegendDot color="var(--status-critical)" label="Out of Stock" />
        </div>
      )}
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
      <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{label}</span>
    </div>
  );
}
