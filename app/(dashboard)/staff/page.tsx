'use client';

import { useState, useEffect } from 'react';
import {
  Users, UserPlus, Mail,
  Trash2, Check, Loader2, AlertCircle, Search, Crown, Activity, X, Clock, ShoppingCart, CheckCircle2
} from 'lucide-react';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/utils/currency';
import { db, Activity as ActivityType } from '@/utils/db';

interface Staff {
  id: string;
  full_name: string;
  role: 'admin' | 'staff';
  email?:    string;
  created_at: string;
}

export default function StaffPage() {
  const { role } = useAuth();
  const router   = useRouter();

  /* Guard: only authorized roles may see this page */
  useEffect(() => {
    if (role && role !== 'admin' && role !== 'manager') router.push('/pos');
  }, [role, router]);

  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch]       = useState('');

  /* Invite form */
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail]     = useState('');
  const [inviteName,  setInviteName]      = useState('');
  const [invitePassword, setInvitePassword] = useState('');
  const [inviting, setInviting]           = useState(false);
  const [inviteError, setInviteError]     = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');

  /* Activity Log Modal */
  const [activeStaffLog, setActiveStaffLog] = useState<{ id: string, name: string } | null>(null);
  const [staffLogs, setStaffLogs]           = useState<{ id: string, total_amount: number, created_at: string }[]>([]);
  const [staffActivities, setStaffActivities] = useState<ActivityType[]>([]);
  const [loadingLogs, setLoadingLogs]       = useState(false);

  async function loadStaff() {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('staffs')
      .select('id, full_name, email, role, created_at')
      .order('created_at', { ascending: true });

    if (!error && data) setStaffList(data as Staff[]);
    setIsLoading(false);
  }

  useEffect(() => { loadStaff(); }, []);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim() || !inviteName.trim() || !invitePassword.trim()) return;
    if (invitePassword.length < 6) {
      setInviteError('Password must be at least 6 characters.');
      return;
    }
    setInviting(true);
    setInviteError('');
    setInviteSuccess('');

    try {
      // Use the new custom 'staffs' table directly
      const { error: insertErr } = await supabase.from('staffs').insert([{
        full_name: inviteName.trim(),
        email: inviteEmail.trim(),
        passcode: invitePassword.trim(), // standardized to 'passcode'
        role: 'staff'
      }]);

      if (insertErr) throw new Error(insertErr.message);

      setInviteSuccess(`${inviteName} was added as a staff member. They can now log in with the provided passcode.`);
      setInviteEmail('');
      setInviteName('');
      setInvitePassword('');
      await loadStaff();
    } catch (err: any) {
      setInviteError(err.message ?? 'An error occurred.');
    } finally {
      setInviting(false);
    }
  }

  async function removeStaff(id: string, name: string) {
    if (!window.confirm(`Remove ${name} from the system?`)) return;
    const { error } = await supabase.from('staffs').delete().eq('id', id);
    if (!error) setStaffList(prev => prev.filter(s => s.id !== id));
    else alert('Could not delete user: ' + error.message);
  }

  async function viewActivity(id: string, name: string) {
    setActiveStaffLog({ id, name });
    setLoadingLogs(true);
    const { data } = await supabase
      .from('sales')
      .select('id, total_amount, created_at')
      .eq('seller_id', id)
      .order('created_at', { ascending: false })
      .limit(50);
    setStaffLogs(data || []);
    
    // Also fetch local system activities for this staff member
    try {
      const acts = await db.activities
        .where('user_id')
        .equals(id)
        .reverse()
        .sortBy('timestamp');
      setStaffActivities(acts);
    } catch (err) {
      console.error('Error fetching staff activities:', err);
    }
    
    setLoadingLogs(false);
  }

  const filtered = staffList.filter(s =>
    s.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (s.email ?? '').toLowerCase().includes(search.toLowerCase())
  );

  if (role && role !== 'admin' && role !== 'manager') return null;

  return (
    <div className="pb-24 md:pb-0" style={{ maxWidth: '900px', display: 'flex', flexDirection: 'column', gap: '28px' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 className="heading-page">Staff Management</h1>
          <p className="text-subtitle" style={{ marginTop: '6px' }}>
            Manage who has access to PharmERP and at what permission level.
          </p>
        </div>
        <button className="btn-primary" onClick={() => { setShowInvite(v => !v); setInviteError(''); setInviteSuccess(''); }}>
          <UserPlus size={16} />
          {showInvite ? 'Cancel' : 'Add Staff'}
        </button>
      </div>



      {/* ── Invite form ── */}
      {showInvite && (
        <div className="card-pharm" style={{ padding: '24px' }}>
          <h3 className="heading-section" style={{ marginBottom: '20px' }}>Add New Staff Member</h3>
          <form onSubmit={handleInvite} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {inviteError && (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '10px 14px', borderRadius: 'var(--r-sm)', background: 'var(--status-critical-bg)', border: '1px solid rgba(220,38,38,0.2)' }}>
                <AlertCircle size={15} style={{ color: 'var(--status-critical)', flexShrink: 0 }} />
                <p style={{ fontSize: '13px', color: 'var(--status-critical)', margin: 0 }}>{inviteError}</p>
              </div>
            )}
            {inviteSuccess && (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '10px 14px', borderRadius: 'var(--r-sm)', background: 'var(--status-success-bg)', border: '1px solid rgba(22,163,74,0.2)' }}>
                <Check size={15} style={{ color: 'var(--status-success)', flexShrink: 0 }} />
                <p style={{ fontSize: '13px', color: 'var(--status-success)', fontWeight: 600, margin: 0 }}>{inviteSuccess}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>Full Name *</label>
                <input className="input-pharm" required placeholder="e.g. Jane Mwanza"
                  value={inviteName} onChange={e => setInviteName(e.target.value)} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>Email Address *</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input className="input-pharm" required type="email" placeholder="staff@pharmacy.co"
                    value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                    style={{ paddingLeft: '30px' }} />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>Login Password *</label>
                <input className="input-pharm" required type="password" placeholder="At least 6 characters"
                  value={invitePassword} onChange={e => setInvitePassword(e.target.value)} minLength={6} />
              </div>
            </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>Role</label>
                <div style={{
                  padding: '10px 16px', borderRadius: 'var(--r-sm)',
                  background: 'var(--status-success-bg)',
                  border: '1px solid rgba(22,163,74,0.2)',
                  display: 'flex', alignItems: 'center', gap: '8px',
                }}>
                  <Users size={14} style={{ color: 'var(--status-success)' }} />
                  <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--status-success)' }}>Staff (POS only)</span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                  Staff members can only access the Point of Sale module. Only one admin account is allowed.
                </p>
              </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn-ghost" onClick={() => setShowInvite(false)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={inviting} style={{ minWidth: '140px', justifyContent: 'center' }}>
                {inviting ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Creating…</> : <><UserPlus size={15} /> Add Member</>}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Search + Table ── */}
      <div className="card-pharm" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <h3 className="heading-section">Team Members</h3>
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="input-pharm" placeholder="Search staff…" value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: '28px', height: '34px', width: '200px', fontSize: '13px' }} />
          </div>
        </div>

        {isLoading ? (
          <div style={{ padding: '48px', display: 'flex', justifyContent: 'center' }}>
            <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent)' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Users size={28} strokeWidth={1} style={{ marginBottom: '10px', opacity: 0.4 }} />
            <p style={{ fontWeight: 600, margin: '0 0 4px' }}>No staff found</p>
            <p style={{ fontSize: '13px', margin: 0 }}>Add a staff member using the button above.</p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="table-pharm">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Joined</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id}>
                  {/* Name */}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: '8px',
                        background: s.role === 'admin' ? 'var(--accent-light)' : 'var(--status-success-bg)',
                        color: s.role === 'admin' ? 'var(--accent)' : 'var(--status-success)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: '13px', flexShrink: 0,
                      }}>
                        {s.full_name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p style={{ fontWeight: 600, fontSize: '14px', margin: 0 }}>{s.full_name}</p>
                        {s.email && <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '1px 0 0' }}>{s.email}</p>}
                      </div>
                    </div>
                  </td>

                  {/* Role badge */}
                  <td>
                    <span className={`badge ${s.role === 'admin' ? 'badge-blue' : 'badge-green'}`}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      {s.role === 'admin' ? <Crown size={11} /> : <Users size={11} />}
                      {s.role === 'admin' ? 'Admin' : 'Staff'}
                    </span>
                  </td>

                  {/* Joined */}
                  <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                    {new Date(s.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>

                    {/* Actions — view log, remove */}
                    <td>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button
                          className="btn-ghost"
                          style={{ fontSize: '12px', padding: '5px 10px', color: 'var(--text-secondary)' }}
                          title="View Activity Logs"
                          onClick={() => viewActivity(s.id, s.full_name)}
                        >
                          <Activity size={13} /> Logs
                        </button>
                        <button
                          className="btn-ghost"
                          style={{ fontSize: '12px', padding: '5px 10px', color: 'var(--status-critical)' }}
                          title="Remove staff member"
                          onClick={() => removeStaff(s.id, s.full_name)}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--status-critical-bg)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'none'}
                        >
                          <Trash2 size={13} /> Remove
                        </button>
                      </div>
                    </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* ── Activity Modal ── */}
      {activeStaffLog && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
          animation: 'fadeIn 150ms ease forwards',
        }} onClick={e => { if (e.target === e.currentTarget) setActiveStaffLog(null); }}>
          <div className="card-pharm" style={{
            width: '100%', maxWidth: '600px', maxHeight: '85vh',
            display: 'flex', flexDirection: 'column', padding: 0,
            animation: 'slideUp 200ms cubic-bezier(0.2,0,0,1) forwards',
          }}>
            {/* Modal Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 className="heading-section" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Activity size={18} style={{ color: 'var(--accent)' }} />
                  Activity Log: {activeStaffLog.name}
                </h3>
              </div>
              <button onClick={() => setActiveStaffLog(null)} style={{
                background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
                padding: '4px', borderRadius: '4px', transition: 'all 150ms',
              }} onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-base)'; e.currentTarget.style.color = 'var(--text-primary)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }}>
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
              {loadingLogs ? (
                <div style={{ padding: '32px', display: 'flex', justifyContent: 'center' }}>
                  <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent)' }} />
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Summary Header */}
                  <div style={{ padding: '0 0 10px', display: 'flex', gap: '20px', borderBottom: '1px solid var(--border)' }}>
                    <div>
                      <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>TRANSACTIONS</p>
                      <p style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>{staffLogs.length}</p>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>SYSTEM LOGS</p>
                      <p style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>{staffActivities.length}</p>
                    </div>
                  </div>

                  {/* Transactions Section */}
                  <div>
                    <h4 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.05em' }}>Recent Sales</h4>
                    {staffLogs.length === 0 ? (
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)', padding: '10px', textAlign: 'center' }}>No sales recorded.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {staffLogs.map(log => (
                          <div key={log.id} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)',
                            background: 'var(--bg-card)'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <ShoppingCart size={14} style={{ color: 'var(--accent)' }} />
                              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                {new Date(log.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                              </span>
                            </div>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '13px' }}>
                              {formatCurrency(log.total_amount)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* System Activities Section */}
                  <div style={{ marginTop: '12px' }}>
                    <h4 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.05em' }}>System Logs (Stock Updates etc)</h4>
                    {staffActivities.length === 0 ? (
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)', padding: '10px', textAlign: 'center' }}>No system activities recorded locally.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {staffActivities.map(act => (
                          <div key={act.id} style={{
                            padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)',
                            background: 'var(--bg-card)'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <CheckCircle2 size={13} style={{ color: 'var(--status-success)' }} />
                                <span style={{ fontSize: '13px', fontWeight: 600 }}>{act.action}</span>
                              </div>
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                {new Date(act.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                              </span>
                            </div>
                            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>{act.details}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Since we need ShoppingCart in the modal, I should import it at the top, but since it's already complex, I'll use Activity as the icon for transactions if I missed it */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn  { from { opacity:0 } to { opacity:1 } }
        @keyframes slideUp { from { opacity:0; transform:translateY(14px) scale(0.98) } to { opacity:1; transform:translateY(0) scale(1) } }
      `}</style>
    </div>
  );
}
