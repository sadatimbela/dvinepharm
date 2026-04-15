'use client';

import React, { useEffect, useState } from 'react';
import { 
  X, Loader2, Package, CheckCircle2, Clock, 
  Truck, ClipboardCheck, History, 
  ChevronDown, ChevronUp, FileText
} from 'lucide-react';
import { useProcurementModuleStore, PurchaseOrder } from '../store/useProcurementModuleStore';
import { formatCurrency } from '@/utils/currency';
import { useAuth } from '@/hooks/useAuth';
import { generatePOPDF } from '../utils/generatePOPDF';

interface Props { isOpen: boolean; onClose: () => void; }

export function POManagementModal({ isOpen, onClose }: Props) {
  const { purchaseOrders, posLoading, fetchPurchaseOrders, updatePOStatus, receiveStock } = useProcurementModuleStore();
  const { user } = useAuth();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [receivingPoId, setReceivingPoId] = useState<string | null>(null);
  const [receiveForm, setReceiveForm] = useState<Record<string, { qty: number, batch: string, expiry: string }>>({});
  const [processing, setProcessing] = useState(false);

  useEffect(() => { if (isOpen) fetchPurchaseOrders(); }, [isOpen, fetchPurchaseOrders]);

  async function handleStatusUpdate(id: string, status: string) {
    setProcessing(true);
    await updatePOStatus(id, status, status === 'approved' ? user?.id : undefined);
    setProcessing(false);
  }

  function startReceiving(po: PurchaseOrder) {
    const initialForm: Record<string, { qty: number, batch: string, expiry: string }> = {};
    po.items?.forEach(item => {
      const remaining = item.quantity_ordered - item.quantity_received;
      initialForm[item.id] = { 
        qty: remaining > 0 ? remaining : 0, 
        batch: `B${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
        expiry: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0]
      };
    });
    setReceiveForm(initialForm);
    setReceivingPoId(po.id);
  }

  async function onSubmitReceive() {
    if (!receivingPoId) return;
    const po = purchaseOrders.find(p => p.id === receivingPoId);
    if (!po) return;

    setProcessing(true);
    const receiveItems = Object.entries(receiveForm)
      .filter(([_, data]) => data.qty > 0)
      .map(([poItemId, data]) => {
        const item = po.items?.find(i => i.id === poItemId);
        return {
          po_item_id: poItemId,
          product_id: item?.product_id || '',
          quantity_received: data.qty,
          batch_number: data.batch,
          expiry_date: data.expiry,
          cost_price: item?.unit_cost || 0
        };
      });

    if (receiveItems.length > 0) {
      const success = await receiveStock(receivingPoId, receiveItems, user?.id);
      if (success) {
        setReceivingPoId(null);
        setExpandedId(receivingPoId);
      }
    }
    setProcessing(false);
  }

  if (!isOpen) return null;

  const statusMeta: Record<string, { label: string, color: string, bg: string, icon: any }> = {
    pending: { label: 'Pending', color: '#64748b', bg: '#f1f5f9', icon: Clock },
    approved: { label: 'Approved', color: '#0ea5e9', bg: '#e0f2fe', icon: CheckCircle2 },
    ordered: { label: 'Ordered', color: '#6366f1', bg: '#e0e7ff', icon: Truck },
    partially_received: { label: 'Partial', color: '#f59e0b', bg: '#fef3c7', icon: Package },
    completed: { label: 'Received', color: '#10b981', bg: '#dcfce7', icon: ClipboardCheck },
    cancelled: { label: 'Cancelled', color: '#ef4444', bg: '#fee2e2', icon: X },
  };

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(15,23,42,0.35)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', animation: 'fadeIn 160ms ease forwards' }}>
      <div style={{ width: '100%', maxWidth: '900px', background: 'rgba(255,255,255,0.98)', backdropFilter: 'blur(24px)', borderRadius: 'var(--r-lg)', boxShadow: '0 24px 64px rgba(0,0,0,0.12)', animation: 'slideUp 200ms cubic-bezier(0.2,0,0,1) forwards', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 28px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: 38, height: 38, borderRadius: '10px', background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <History size={18} color="#16a34a" strokeWidth={2} />
            </div>
            <div>
              <h2 style={{ fontWeight: 700, fontSize: '17px', margin: 0 }}>Purchase Order Management</h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0' }}>Track, approve, and receive inventory arrivals</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '6px', borderRadius: '6px', display: 'flex' }}><X size={18} /></button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', padding: '20px 28px 24px', flex: 1 }}>
          {posLoading ? (
            <div style={{ padding: '64px', textAlign: 'center' }}>
              <Loader2 size={32} style={{ animation: 'spin 1.5s linear infinite', margin: '0 auto 12px', color: 'var(--accent)' }} />
              <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Syncing order statuses…</p>
            </div>
          ) : purchaseOrders.length === 0 ? (
            <div style={{ padding: '64px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Package size={48} style={{ opacity: 0.1, margin: '0 auto 16px' }} />
              <p style={{ fontWeight: 700, fontSize: '18px', color: 'var(--text-secondary)' }}>No Purchase Orders Yet</p>
              <p style={{ fontSize: '14px', marginTop: '4px' }}>Once you create an order, it will appear here for tracking.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {purchaseOrders.map(po => {
                const meta = statusMeta[po.status] || statusMeta.pending;
                const StatusIcon = meta.icon;
                const isExpanded = expandedId === po.id;
                const isReceiving = receivingPoId === po.id;

                return (
                  <div key={po.id} style={{ borderRadius: 'var(--r-sm)', border: '1px solid var(--border)', background: '#fff', overflow: 'hidden' }}>
                    <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', background: isExpanded ? 'var(--bg-base)' : '#fff' }}>
                      <div style={{ width: 44, height: 44, borderRadius: '12px', background: meta.bg, color: meta.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <StatusIcon size={22} strokeWidth={1.8} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)' }}>{po.po_number}</span>
                          <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: meta.color, padding: '2px 8px', borderRadius: '4px', background: meta.bg, letterSpacing: '0.04em' }}>{meta.label}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', marginTop: '4px', fontSize: '13px', color: 'var(--text-muted)' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{po.supplier?.name}</span>
                          <span>•</span>
                          <span>{new Date(po.created_at).toLocaleDateString()}</span>
                          <span>•</span>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{formatCurrency(po.total_amount)}</span>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button 
                          className="btn-ghost" 
                          style={{ fontSize: '12px', padding: '6px 8px', color: '#10b981' }}
                          onClick={() => generatePOPDF(po)}
                          title="Download PO PDF"
                        >
                          <FileText size={16} />
                        </button>
                        {po.status === 'pending' && (
                          <button 
                            className="btn-primary" 
                            style={{ fontSize: '12px', padding: '6px 12px', background: '#0ea5e9' }}
                            onClick={() => handleStatusUpdate(po.id, 'approved')}
                          >Approve</button>
                        )}
                        {(po.status === 'approved' || po.status === 'ordered') && (
                          <button 
                            className="btn-primary" 
                            style={{ fontSize: '12px', padding: '6px 12px', background: '#6366f1' }}
                            onClick={() => handleStatusUpdate(po.id, 'ordered')}
                          >Order</button>
                        )}
                        {(po.status === 'ordered' || po.status === 'partially_received') && (
                          <button 
                            className="btn-secondary" 
                            style={{ fontSize: '12px', padding: '6px 12px' }}
                            onClick={() => startReceiving(po)}
                          >Receive</button>
                        )}
                        <button 
                          onClick={() => setExpandedId(isExpanded ? null : po.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--text-muted)' }}
                        >
                          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </button>
                      </div>
                    </div>

                    {/* EXPANDED VIEW: ITEM LIST */}
                    {isExpanded && !isReceiving && (
                      <div style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-base)', padding: '16px 20px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                          <thead>
                            <tr style={{ textAlign: 'left', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                              <th style={{ padding: '8px 0', fontSize: '11px', textTransform: 'uppercase' }}>Items</th>
                              <th style={{ padding: '8px 0', fontSize: '11px', textTransform: 'uppercase', textAlign: 'right' }}>Ordered</th>
                              <th style={{ padding: '8px 0', fontSize: '11px', textTransform: 'uppercase', textAlign: 'right' }}>Received</th>
                              <th style={{ padding: '8px 0', fontSize: '11px', textTransform: 'uppercase', textAlign: 'right' }}>Cost</th>
                            </tr>
                          </thead>
                          <tbody>
                            {po.items?.map(item => (
                              <tr key={item.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                                <td style={{ padding: '10px 0', fontWeight: 600 }}>{item.product?.name}</td>
                                <td style={{ padding: '10px 0', textAlign: 'right' }}>{item.quantity_ordered}</td>
                                <td style={{ padding: '10px 0', textAlign: 'right', color: item.quantity_received >= item.quantity_ordered ? 'var(--status-success)' : 'var(--text-secondary)' }}>{item.quantity_received}</td>
                                <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: 700 }}>{formatCurrency(item.unit_cost)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {po.notes && (
                          <div style={{ marginTop: '16px', padding: '10px', background: '#fff', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '12px', color: 'var(--text-secondary)' }}>
                            <strong>Notes:</strong> {po.notes}
                          </div>
                        )}

                        {po.shipment && (
                          <div style={{ marginTop: '12px', padding: '12px', background: 'linear-gradient(135deg, #e0f2fe, #f0f9ff)', borderRadius: '8px', border: '1px solid #bae6fd', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Truck size={18} color="#0369a1" />
                            <div style={{ flex: 1 }}>
                              <p style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: '#0369a1' }}>In-Transit Tracking</p>
                              <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#0c4a6e' }}>
                                {po.shipment.carrier}: <strong>{po.shipment.tracking_number}</strong> · 
                                Status: <span style={{ fontWeight: 700 }}>{po.shipment.status.replace('_', ' ')}</span>
                                {po.shipment.estimated_arrival && ` · Est. Arrival: ${new Date(po.shipment.estimated_arrival).toLocaleDateString()}`}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* RECEIVING FLOW PANEL */}
                    {isReceiving && (
                      <div style={{ borderTop: '2px solid #6366f1', background: '#f8fafc', padding: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                          <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Package size={16} /> Record Arrivals for {po.po_number}
                          </h4>
                          <button onClick={() => setReceivingPoId(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {po.items?.filter(item => item.quantity_received < item.quantity_ordered).map(item => (
                            <div key={item.id} style={{ background: '#fff', padding: '14px', borderRadius: '8px', border: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '12px', alignItems: 'start' }}>
                              <div>
                                <p style={{ margin: 0, fontSize: '13px', fontWeight: 700 }}>{item.product?.name}</p>
                                <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>Remaining: {item.quantity_ordered - item.quantity_received}</p>
                              </div>
                              <div>
                                <label style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Qty to Receive</label>
                                <input className="input-pharm" type="number" style={{ height: '36px', fontSize: '13px' }} value={receiveForm[item.id]?.qty} onChange={e => setReceiveForm({...receiveForm, [item.id]: { ...receiveForm[item.id], qty: parseInt(e.target.value) || 0 }})} />
                              </div>
                              <div>
                                <label style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Batch #</label>
                                <input className="input-pharm" style={{ height: '36px', fontSize: '13px' }} value={receiveForm[item.id]?.batch} onChange={e => setReceiveForm({...receiveForm, [item.id]: { ...receiveForm[item.id], batch: e.target.value }})} />
                              </div>
                              <div>
                                <label style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Expiry</label>
                                <input className="input-pharm" type="date" style={{ height: '36px', fontSize: '12px' }} value={receiveForm[item.id]?.expiry} onChange={e => setReceiveForm({...receiveForm, [item.id]: { ...receiveForm[item.id], expiry: e.target.value }})} />
                              </div>
                            </div>
                          ))}
                        </div>

                        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                          <button 
                            className="btn-primary" 
                            disabled={processing}
                            onClick={onSubmitReceive}
                            style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', padding: '10px 24px', fontWeight: 700 }}
                          >
                            {processing ? <Loader2 size={18} style={{ animation: 'spin 1.5s linear infinite' }} /> : 'Commit Received Stock'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px) scale(0.98) } to { opacity: 1; transform: translateY(0) scale(1) } }
        @keyframes spin    { to { transform: rotate(360deg) } }
      `}</style>
    </div>
  );
}
