'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/utils/db';
import { useAuth } from '@/hooks/useAuth';
import { Activity, Clock, FileText, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '@/utils/currency';

export default function MyActivityPage() {
  const { user } = useAuth();
  
  const sales = useLiveQuery(
    async () => {
      if (!user) return [];
      return await db.sales
        .where('seller_id')
        .equals(user.id)
        .reverse()
        .sortBy('created_at');
    },
    [user]
  );

  const activities = useLiveQuery(
    async () => {
      if (!user) return [];
      return await db.activities
        .where('user_id')
        .equals(user.id)
        .reverse()
        .sortBy('timestamp');
    },
    [user]
  );

  const totalSales = sales?.length || 0;
  const totalRevenue = sales?.reduce((sum, s) => sum + s.total_amount, 0) || 0;

  return (
    <div style={{ maxWidth: '1000px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* ── Header ── */}
      <div>
        <h1 className="heading-page" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Activity size={24} style={{ color: 'var(--accent)' }} />
          My Activity Logs
        </h1>
        <p className="text-subtitle" style={{ marginTop: '6px' }}>
          Track your recent point of sale transactions and system activities.
        </p>
      </div>

      {/* ── Summary Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '16px' }}>
        <div className="card-pharm" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: 48, height: 48, borderRadius: '12px', background: 'var(--accent-light)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <FileText size={20} strokeWidth={2} />
          </div>
          <div style={{ overflow: 'hidden' }}>
            <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Transactions
            </p>
            <p style={{ margin: '2px 0 0', fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
              {totalSales}
            </p>
          </div>
        </div>

        <div className="card-pharm" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: 48, height: 48, borderRadius: '12px', background: 'var(--status-success-bg)', color: 'var(--status-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <CheckCircle2 size={20} strokeWidth={2} />
          </div>
          <div style={{ overflow: 'hidden' }}>
            <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Revenue
            </p>
            <p style={{ margin: '2px 0 0', fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
              {formatCurrency(totalRevenue)}
            </p>
          </div>
        </div>
      </div>

      {/* ── Transactions List ── */}
      <div className="card-pharm" style={{ padding: 0 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <h3 className="heading-section">Recent Point of Sale Sales</h3>
        </div>

        {!sales ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
        ) : sales.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Activity size={32} style={{ opacity: 0.3, margin: '0 auto 12px' }} />
            <p style={{ fontWeight: 600, margin: '0 0 4px' }}>No local sales found</p>
            <p style={{ fontSize: '13px', margin: 0 }}>Your sales will appear here as they are created.</p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="table-pharm">
            <thead>
              <tr>
                <th>Status</th>
                <th>Time</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr key={sale.localId || sale.id}>
                  <td>
                    <span className={`badge ${sale.synced ? 'badge-green' : 'badge-amber'}`} style={{ fontSize: '10px', textTransform: 'uppercase' }}>
                      {sale.synced ? 'Synced' : 'Pending'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                      <Clock size={14} />
                      {new Date(sale.created_at).toLocaleString('en-US', {
                        month: 'short', day: 'numeric',
                        hour: 'numeric', minute: '2-digit'
                      })}
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {formatCurrency(sale.total_amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* ── General Activity List ── */}
      <div className="card-pharm" style={{ padding: 0 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <h3 className="heading-section">System Activities (Stock Updates, etc.)</h3>
        </div>

        {!activities ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
        ) : activities.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Activity size={32} style={{ opacity: 0.3, margin: '0 auto 12px' }} />
            <p style={{ fontWeight: 600, margin: '0 0 4px' }}>No system activity found</p>
            <p style={{ fontSize: '13px', margin: 0 }}>Actions like manual stock updates will be logged here.</p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="table-pharm">
            <thead>
              <tr>
                <th>Action</th>
                <th>Details</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {activities.map((act) => (
                <tr key={act.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle2 size={14} style={{ color: 'var(--status-success)' }} />
                      <span style={{ fontWeight: 600, fontSize: '13px' }}>{act.action}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                    {act.details}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                      <Clock size={14} />
                      {new Date(act.timestamp).toLocaleString('en-US', {
                        month: 'short', day: 'numeric',
                        hour: 'numeric', minute: '2-digit'
                      })}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

    </div>
  );
}
