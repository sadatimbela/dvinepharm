'use client';

import React, { useState } from 'react';
import { ProcurementForm } from '@/modules/procurement/components/ProcurementForm';
import { ProcurementPreview } from '@/modules/procurement/components/ProcurementPreview';
import { VoucherHistoryModal } from '@/modules/procurement/components/VoucherHistoryModal';
import { SupplierListModal } from '@/modules/procurement/components/SupplierListModal';
import { CreatePOModal } from '@/modules/procurement/components/CreatePOModal';
import { POManagementModal } from '@/modules/procurement/components/POManagementModal';
import { PriceHistoryModal } from '@/modules/procurement/components/PriceHistoryModal';
import { GoalsManagementModal } from '@/modules/procurement/components/GoalsManagementModal';
import { FileText, PackagePlus, Users, ShoppingCart, TrendingUp, History, Target } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { useAuth } from '@/hooks/useAuth';

export default function ProcurementPage() {
  const { user } = useAuth();
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const closeModal = () => setActiveModal(null);

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', flexDirection: 'column' }}>

      {/* ── Page Header ── */}
      <PageHeader 
        title="Procurement & Supply Chain"
        subtitle="End-to-end purchasing workflow: Manage suppliers, generate POs, track trends, and receive stock."
        icon={<PackagePlus />}
        iconBg="linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)"
        iconColor="#4f46e5"
        actions={
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
               className="btn-secondary"
               onClick={() => setActiveModal('suppliers')}
               style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
            >
              <Users size={15} strokeWidth={1.5} /> Suppliers
            </button>
            
            <button
               className="btn-secondary"
               onClick={() => setActiveModal('po_list')}
               style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
            >
              <History size={15} strokeWidth={1.5} /> PO Records
            </button>

            <button
               className="btn-secondary"
               onClick={() => setActiveModal('trends')}
               style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
            >
              <TrendingUp size={15} strokeWidth={1.5} /> Price Analytics
            </button>

            <button
               className="btn-secondary"
               onClick={() => setActiveModal('goals')}
               style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
            >
              <Target size={15} strokeWidth={1.5} /> Goals
            </button>

            <div style={{ width: '1px', height: '20px', background: 'var(--border)', margin: '0 4px' }} className="hidden sm:block" />

            <button
               className="btn-primary"
               onClick={() => setActiveModal('create_po')}
               style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', background: '#6366f1' }}
            >
              <ShoppingCart size={15} strokeWidth={1.5} /> Create PO
            </button>
          </div>
        }
      />

      {/* ── Procurement Quick Entry Layout ── */}
      <div className="flex flex-col md:grid md:grid-cols-5 gap-6 items-start">
        <div className="w-full md:col-span-3">
          <ProcurementForm />
        </div>
        <div className="hidden md:block w-full md:col-span-2">
          <ProcurementPreview />
        </div>
      </div>

      {/* ── Modals Overlay System ── */}
      <SupplierListModal isOpen={activeModal === 'suppliers'} onClose={closeModal} />
      <CreatePOModal isOpen={activeModal === 'create_po'} onClose={closeModal} userId={user?.id} />
      <POManagementModal isOpen={activeModal === 'po_list'} onClose={closeModal} />
      <PriceHistoryModal isOpen={activeModal === 'trends'} onClose={closeModal} />
      <GoalsManagementModal isOpen={activeModal === 'goals'} onClose={closeModal} />
      <VoucherHistoryModal isOpen={activeModal === 'vouchers'} onClose={closeModal} />

    </div>
  );
}
