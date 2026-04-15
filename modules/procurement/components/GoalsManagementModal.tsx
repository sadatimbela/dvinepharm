'use client';

import React, { useEffect, useState } from 'react';
import { X, Target, Plus, Loader2, TrendingUp, Calendar, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useProcurementModuleStore, ProcurementGoal } from '../store/useProcurementModuleStore';
import { formatCurrency } from '@/utils/currency';

interface Props { isOpen: boolean; onClose: () => void; }

const TARGET_TYPES = {
  spend_limit: 'Total Spend Limit',
  order_count: 'Purchase Order Count',
  supplier_reliability: 'Supplier Reliability Min (%)',
  stock_availability: 'In-Stock Rate (%)',
};

export function GoalsManagementModal({ isOpen, onClose }: Props) {
  const { goals, goalsLoading, fetchGoals, addGoal, updateGoalStatus } = useProcurementModuleStore();
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setProcessing] = useState(false);
  const [form, setForm] = useState({
    title: '',
    target_type: 'spend_limit' as ProcurementGoal['target_type'],
    target_value: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
  });

  useEffect(() => { if (isOpen) fetchGoals(); }, [isOpen]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setProcessing(true);
    const success = await addGoal({
      ...form,
      target_value: parseFloat(form.target_value as string),
      status: 'active',
    });
    if (success) {
      setForm({
        title: '',
        target_type: 'spend_limit',
        target_value: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      });
      setShowAdd(false);
    }
    setProcessing(false);
  }

  if (!isOpen) return null;

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(15,23,42,0.35)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', animation: 'fadeIn 160ms ease forwards' }}>
      <div style={{ width: '100%', maxWidth: '750px', background: '#fff', borderRadius: 'var(--r-lg)', boxShadow: '0 24px 64px rgba(0,0,0,0.12)', animation: 'slideUp 200ms cubic-bezier(0.2,0,0,1) forwards', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 28px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: 38, height: 38, borderRadius: '10px', background: 'linear-gradient(135deg, #e0f2fe, #bae6fd)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Target size={18} color="#0369a1" strokeWidth={2.5} />
            </div>
            <div>
              <h2 style={{ fontWeight: 700, fontSize: '17px', margin: 0 }}>Procurement Strategic Goals</h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0' }}>Define and track metrics for supply chain optimization</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setShowAdd(!showAdd)} className="btn-secondary" style={{ fontSize: '13px', padding: '6px 14px' }}>
              <Plus size={14} style={{ marginRight: '4px' }} /> Create Goal
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '6px' }}><X size={18} /></button>
          </div>
        </div>

        {/* Add Form */}
        {showAdd && (
          <form onSubmit={handleAdd} style={{ padding: '20px 28px', borderBottom: '1px solid var(--border)', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr', gap: '12px' }}>
              <input required className="input-pharm" placeholder="Goal Title (e.g. Q1 Budget Control)" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              <select className="input-pharm" value={form.target_type} onChange={e => setForm({ ...form, target_type: e.target.value as any })}>
                {Object.entries(TARGET_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <input required className="input-pharm" type="number" placeholder="Target Value" value={form.target_value} onChange={e => setForm({ ...form, target_value: e.target.value })} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <input required className="input-pharm" type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} />
                <input required className="input-pharm" type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button type="button" className="btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? <Loader2 size={14} className="animate-spin" /> : 'Set Goal'}</button>
            </div>
          </form>
        )}

        {/* List */}
        <div style={{ overflowY: 'auto', padding: '16px 28px 24px', flex: 1 }}>
          {goalsLoading ? (
            <div style={{ padding: '48px', textAlign: 'center' }}><Loader2 size={24} className="animate-spin" style={{ margin: '0 auto' }} /></div>
          ) : goals.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', opacity: 0.5 }}>
              <Target size={32} style={{ margin: '0 auto 12px' }} />
              <p>No procurement goals defined yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {goals.map(g => {
                const isComplete = g.status === 'reached';
                const pct = Math.min(Math.round((g.current_value / g.target_value) * 100), 100);
                const color = isComplete ? '#10b981' : pct > 80 ? '#f59e0b' : '#3b82f6';

                return (
                  <div key={g.id} style={{ padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ width: 34, height: 34, borderRadius: '8px', background: isComplete ? '#dcfce7' : '#f0f9ff', color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {isComplete ? <CheckCircle2 size={18} /> : <TrendingUp size={18} />}
                        </div>
                        <div>
                          <p style={{ margin: 0, fontWeight: 700, fontSize: '14px' }}>{g.title}</p>
                          <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>{TARGET_TYPES[g.target_type]}</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={10} /> {new Date(g.start_date).toLocaleDateString()} - {new Date(g.end_date).toLocaleDateString()}
                        </span>
                        <div style={{ marginTop: '4px', fontSize: '13px', fontWeight: 800, color }}>{pct}% Progress</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ width: '100%', height: '6px', background: 'var(--bg-base)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: color, transition: 'width 600ms cubic-bezier(0.2,0,0,1)' }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)' }}>
                        <span>Current: {g.target_type === 'spend_limit' ? formatCurrency(g.current_value) : g.current_value}</span>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>Target: {g.target_type === 'spend_limit' ? formatCurrency(g.target_value) : g.target_value}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
