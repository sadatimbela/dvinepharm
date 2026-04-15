'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  User, Lock, Bell, Palette, Database, Building2,
  Save, Check, Eye, EyeOff, Shield, LogOut, ChevronRight,
  Smartphone, Phone, MessageSquare, Info,
} from 'lucide-react';
import Topbar from '@/components/Topbar';
import { useSettingsStore } from '@/stores/useSettingsStore';

/* ── Section wrapper ── */
function Section({ title, description, children }: {
  title: string; description: string; children: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 className="heading-section">{title}</h2>
        <p className="text-subtitle" style={{ marginTop: '4px' }}>{description}</p>
      </div>
      {children}
    </div>
  );
}

/* ── Setting row ── */
function SettingRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: '24px', padding: '16px 0',
      borderBottom: '1px solid var(--border)',
    }}>
      <div style={{ flex: 1 }}>
        <p style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)', margin: 0 }}>{label}</p>
        {hint && <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '3px 0 0' }}>{hint}</p>}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}

/* ── Toggle switch ── */
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        width: 44, height: 24, borderRadius: 999,
        background: checked ? 'var(--accent)' : 'var(--border-strong)',
        border: 'none', cursor: 'pointer', position: 'relative',
        transition: 'background 200ms cubic-bezier(0.2,0,0,1)',
        flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute',
        top: 3, left: checked ? 23 : 3,
        width: 18, height: 18, borderRadius: '50%',
        background: '#fff',
        boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
        transition: 'left 200ms cubic-bezier(0.2,0,0,1)',
      }} />
    </button>
  );
}

/* ── Nav sidebar ── */
const TABS = [
  { id: 'profile',    label: 'Profile',       icon: User },
  { id: 'security',  label: 'Security',      icon: Lock },
  { id: 'pharmacy',  label: 'Pharmacy',       icon: Building2 },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'appearance', label: 'Appearance',   icon: Palette },
  { id: 'data',      label: 'Data & Backup',  icon: Database },
];

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const { pharmacyName: storedPharmacy, currency: storedCurrency, lowStockThreshold: storedThreshold, setSettings } = useSettingsStore();

  const [tab, setTab] = useState('profile');
  const [saved, setSaved] = useState(false);

  /* Profile state */
  const [displayName, setDisplayName] = useState('Admin');
  const [pharmacyName, setPharmacyName] = useState(storedPharmacy);
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [currency, setCurrency] = useState(storedCurrency);
  const [lowStockThreshold, setLowStockThreshold] = useState(storedThreshold);

  /* Security state */
  const [showPw, setShowPw] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');

  /* Notification state */
  const [notifLowStock, setNotifLowStock] = useState(true);
  const [notifExpiry, setNotifExpiry]     = useState(true);
  const [notifSales, setNotifSales]       = useState(false);
  const [notifEmail, setNotifEmail]       = useState(true);

  /* SMS notification state */
  const [smsEnabled, setSmsEnabled]           = useState(false);
  const [smsPhone, setSmsPhone]               = useState('');
  const [smsPrefix, setSmsPrefix]             = useState('+255');
  const [smsLowStock, setSmsLowStock]         = useState(true);
  const [smsExpiry, setSmsExpiry]             = useState(true);
  const [smsDailySummary, setSmsDailySummary] = useState(false);
  const [smsTesting, setSmsTesting]           = useState(false);
  const [smsTestSent, setSmsTestSent]         = useState(false);

  async function handleTestSms() {
    if (!smsPhone.trim()) return;
    setSmsTesting(true);
    // Simulated — wire to your SMS gateway (Africa's Talking, Twilio, etc.)
    await new Promise(r => setTimeout(r, 1800));
    setSmsTesting(false);
    setSmsTestSent(true);
    setTimeout(() => setSmsTestSent(false), 3000);
  }

  /* Appearance state */
  const [theme, setTheme] = useState<'light' | 'auto'>('light');
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable');

  const handleSave = () => {
    setSettings({
      pharmacyName,
      currency,
      lowStockThreshold
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };
  // #region agent log
  fetch('http://127.0.0.1:7566/ingest/c2169ce9-e1e9-4150-b7be-e63abfdacca3',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'71b753'},body:JSON.stringify({sessionId:'71b753',runId:'settings-render',hypothesisId:'H5',location:'app/(dashboard)/settings/page.tsx:134',message:'settings page render',data:{tab},timestamp:Date.now()})}).catch(()=>{});
  // #endregion

  return (
    <div className="pb-24 flex flex-col gap-6 md:pb-0">
      <Topbar title="Settings" />

      <div className="flex flex-col md:flex-row gap-6 md:gap-8 max-w-[1100px] w-full">

        {/* ── Left nav ── */}
        <div className="w-full md:w-[220px] shrink-0">
          <div className="card-pharm md:sticky md:top-[88px]" style={{ padding: '8px', zIndex: 10 }}>
            {/* Wrapper for horizontal scrolling on mobile */}
            <div className="flex flex-row md:flex-col overflow-x-auto gap-2 md:gap-1 pb-1 md:pb-0 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className="flex items-center gap-2 w-max md:w-full px-3 py-2 rounded-md shrink-0 text-left transition-all duration-150"
                style={{
                  fontWeight: tab === id ? 600 : 500,
                  fontSize: '14px',
                  background: tab === id ? 'var(--accent-light)' : 'transparent',
                  color: tab === id ? 'var(--accent-dark)' : 'var(--text-secondary)',
                }}
              >
                <Icon size={16} strokeWidth={tab === id ? 2.5 : 1.5} />
                {label}
              </button>
            ))}

            {/* Sign out */}
            <div className="md:border-t md:border-[var(--border)] md:mt-2 md:pt-2 flex items-center shrink-0">
              <button
                onClick={signOut}
                className="flex items-center gap-2 w-max md:w-full px-3 py-2 rounded-md shrink-0 text-left transition-all duration-150 font-medium text-sm text-[var(--status-critical)] bg-transparent hover:bg-[var(--status-critical-bg)]"
              >
                <LogOut size={16} />
                Sign out
              </button>
            </div>
            </div>{/* End scrolling wrapper */}
          </div>
        </div>

        {/* ── Right content ── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="card-pharm p-5 md:p-8">

            {/* PROFILE */}
            {tab === 'profile' && (
              <Section title="Profile Information" description="Your account details and contact information.">
                {/* Avatar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: '16px',
                    background: 'var(--accent)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '22px', fontWeight: 700, color: '#fff',
                    boxShadow: 'var(--shadow-btn-primary)',
                  }}>
                    {displayName.charAt(0).toUpperCase() || 'A'}
                  </div>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '16px', margin: 0 }}>{displayName || 'Admin'}</p>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '3px 0 0' }}>{user?.email || 'admin@gmail.com'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
                  {[
                    { label: 'Display Name', value: displayName, set: setDisplayName, placeholder: 'e.g. Jane Doe' },
                    { label: 'Phone Number', value: phone, set: setPhone, placeholder: '+255 XXX XXX XXX' },
                  ].map(({ label, value, set, placeholder }) => (
                    <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</label>
                      <input className="input-pharm" value={value} placeholder={placeholder}
                        onChange={e => set(e.target.value)} />
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* SECURITY */}
            {tab === 'security' && (
              <Section title="Security" description="Manage your password and account security settings.">
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '14px 16px', borderRadius: 'var(--r-sm)',
                  background: 'var(--status-info-bg)',
                  border: '1px solid var(--accent-mid)',
                }}>
                  <Shield size={18} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                  <p style={{ fontSize: '13px', color: 'var(--accent-dark)', margin: 0 }}>
                    Your account is secured with Supabase authentication. Password changes apply immediately.
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {[
                    { label: 'Current Password', value: currentPw, set: setCurrentPw },
                    { label: 'New Password',     value: newPw,     set: setNewPw     },
                    { label: 'Confirm Password', value: confirmPw, set: setConfirmPw },
                  ].map(({ label, value, set }) => (
                    <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          className="input-pharm"
                          type={showPw ? 'text' : 'password'}
                          value={value}
                          placeholder="••••••••••••"
                          onChange={e => set(e.target.value)}
                          style={{ paddingRight: '44px' }}
                        />
                        <button onClick={() => setShowPw(v => !v)} style={{
                          position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                          background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                          display: 'flex', padding: 0,
                        }}>
                          {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* PHARMACY */}
            {tab === 'pharmacy' && (
              <Section title="Pharmacy Details" description="Configure your pharmacy profile and operational settings.">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Pharmacy Name</label>
                    <input className="input-pharm" value={pharmacyName}
                      onChange={e => setPharmacyName(e.target.value)} placeholder="e.g. Kilimanjaro Pharmacy" />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Physical Address</label>
                    <input className="input-pharm" value={address}
                      onChange={e => setAddress(e.target.value)} placeholder="Street, City, Region" />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Default Currency</label>
                    <select className="input-pharm" value={currency} onChange={e => setCurrency(e.target.value)}>
                      <option value="TZS">TZS — Tanzanian Shilling</option>
                      <option value="KES">KES — Kenyan Shilling</option>
                      <option value="UGX">UGX — Ugandan Shilling</option>
                      <option value="USD">USD — US Dollar</option>
                    </select>
                  </div>
                  <SettingRow label="Low Stock Threshold" hint="Items below this count trigger an alert">
                    <input className="input-pharm" type="number" value={lowStockThreshold}
                      onChange={e => setLowStockThreshold(Number(e.target.value))}
                      style={{ width: '80px', textAlign: 'center' }} />
                  </SettingRow>
                </div>
              </Section>
            )}

            {/* NOTIFICATIONS */}
            {tab === 'notifications' && (
              <Section title="Notifications" description="Choose which events trigger alerts and how you receive them.">

                {/* ── Channel header ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                  <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Alert Events
                  </p>

                  {/* Column header */}
                  <div className="grid grid-cols-[1fr_auto_auto] gap-x-2 sm:gap-x-8 py-2 border-b border-[var(--border)] items-center">
                    <span />
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <MessageSquare size={12} /> Email
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: smsEnabled ? 'var(--text-muted)' : 'var(--border-strong)', display: 'flex', alignItems: 'center', gap: '5px', transition: 'color 200ms' }}>
                      <Smartphone size={12} /> SMS
                    </span>
                  </div>

                  {/* Alert rows */}
                  {[
                    {
                      label: 'Low stock alerts',
                      hint: 'Notify when item quantity drops below threshold',
                      emailChecked: notifLowStock, onEmail: setNotifLowStock,
                      smsChecked: smsLowStock,     onSms: setSmsLowStock,
                    },
                    {
                      label: 'Expiry warnings',
                      hint: 'Alert 30 days before any item expires',
                      emailChecked: notifExpiry,  onEmail: setNotifExpiry,
                      smsChecked: smsExpiry,      onSms: setSmsExpiry,
                    },
                    {
                      label: 'Daily sales summary',
                      hint: 'End-of-day POS transaction summary',
                      emailChecked: notifSales,      onEmail: setNotifSales,
                      smsChecked: smsDailySummary,   onSms: setSmsDailySummary,
                    },
                    {
                      label: 'All email updates',
                      hint: 'Master toggle for all email notifications',
                      emailChecked: notifEmail,  onEmail: setNotifEmail,
                      smsChecked: null,           onSms: null,
                    },
                  ].map(({ label, hint, emailChecked, onEmail, smsChecked, onSms }) => (
                    <div key={label} className="grid grid-cols-[1fr_auto_auto] gap-x-2 sm:gap-x-8 py-3.5 border-b border-[var(--border)] items-center">
                      <div>
                        <p style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)', margin: 0 }}>{label}</p>
                        {hint && <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '3px 0 0' }}>{hint}</p>}
                      </div>
                      <Toggle checked={emailChecked} onChange={onEmail} />
                      <div style={{ opacity: (onSms && smsEnabled) ? 1 : 0.3, pointerEvents: (onSms && smsEnabled) ? 'auto' : 'none', transition: 'opacity 200ms' }}>
                        {onSms
                          ? <Toggle checked={smsChecked as boolean} onChange={onSms} />
                          : <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>—</span>
                        }
                      </div>
                    </div>
                  ))}
                </div>

                {/* ── SMS Configuration Card ── */}
                <div style={{
                  borderRadius: 'var(--r-md)',
                  border: `1.5px solid ${smsEnabled ? 'var(--accent-mid)' : 'var(--border)'}`,
                  overflow: 'hidden',
                  transition: 'border-color 250ms',
                }}>
                  {/* SMS master toggle header */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '16px 20px',
                    background: smsEnabled ? 'var(--accent-light)' : 'var(--bg-base)',
                    transition: 'background 250ms',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '10px',
                        background: smsEnabled ? 'var(--accent)' : 'var(--border-strong)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'background 250ms',
                        boxShadow: smsEnabled ? 'var(--shadow-btn-primary)' : 'none',
                      }}>
                        <Smartphone size={17} color={smsEnabled ? '#fff' : 'var(--bg-card)'} />
                      </div>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: '14px', margin: 0, color: smsEnabled ? 'var(--accent-dark)' : 'var(--text-primary)' }}>
                          SMS Notifications
                        </p>
                        <p style={{ fontSize: '12px', color: smsEnabled ? 'var(--accent)' : 'var(--text-muted)', margin: '2px 0 0' }}>
                          {smsEnabled ? 'Active — alerts will be sent to your phone' : 'Receive critical alerts directly to your phone'}
                        </p>
                      </div>
                    </div>
                    <Toggle checked={smsEnabled} onChange={setSmsEnabled} />
                  </div>

                  {/* Phone number input — only visible when SMS is enabled */}
                  {smsEnabled && (
                    <div style={{
                      padding: '20px',
                      borderTop: '1px solid var(--accent-mid)',
                      background: 'rgba(255,255,255,0.7)',
                      display: 'flex', flexDirection: 'column', gap: '16px',
                    }}>

                      {/* Number input */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                          <Phone size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                          Phone Number for SMS Alerts
                        </label>
                        <div className="flex flex-col sm:flex-row gap-2">
                          {/* Country prefix */}
                          <select
                            value={smsPrefix}
                            onChange={e => setSmsPrefix(e.target.value)}
                            style={{
                              padding: '6px 10px', height: '40px',
                              border: '1px solid var(--border-strong)', borderRadius: 'var(--r-sm)',
                              background: 'var(--bg-card)', fontSize: '14px', fontWeight: 600,
                              color: 'var(--text-primary)', cursor: 'pointer', flexShrink: 0,
                            }}
                          >
                            <option value="+255">🇹🇿 +255</option>
                            <option value="+254">🇰🇪 +254</option>
                            <option value="+256">🇺🇬 +256</option>
                            <option value="+250">🇷🇼 +250</option>
                            <option value="+251">🇪🇹 +251</option>
                            <option value="+27" >🇿🇦 +27</option>
                            <option value="+1"  >🇺🇸 +1</option>
                            <option value="+44" >🇬🇧 +44</option>
                          </select>

                          {/* Number field */}
                          <input
                            className="input-pharm"
                            type="tel"
                            value={smsPhone}
                            onChange={e => setSmsPhone(e.target.value.replace(/[^0-9]/g, ''))}
                            placeholder="712 345 678"
                            maxLength={12}
                            style={{ flex: 1, letterSpacing: '0.05em', fontSize: '15px' }}
                          />

                          {/* Test button */}
                          <button
                            className={smsTestSent ? 'btn-secondary' : 'btn-ghost'}
                            onClick={handleTestSms}
                            disabled={smsTesting || !smsPhone.trim() || smsTestSent}
                            style={{ flexShrink: 0, fontSize: '13px', minWidth: '100px', justifyContent: 'center' }}
                          >
                            {smsTesting
                              ? <><span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span> Sending…</>
                              : smsTestSent
                              ? <><Check size={13} /> Sent!</>
                              : <><Smartphone size={13} /> Test SMS</>}
                          </button>
                        </div>

                        {/* Preview of full number */}
                        {smsPhone && (
                          <p style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 600, margin: '0' }}>
                            Full number: {smsPrefix} {smsPhone}
                          </p>
                        )}
                      </div>

                      {/* Info note */}
                      <div style={{
                        display: 'flex', gap: '10px', alignItems: 'flex-start',
                        padding: '10px 12px', borderRadius: 'var(--r-sm)',
                        background: 'var(--status-info-bg)',
                        border: '1px solid rgba(0,103,192,0.12)',
                      }}>
                        <Info size={14} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '1px' }} />
                        <p style={{ fontSize: '12px', color: 'var(--accent-dark)', margin: 0, lineHeight: 1.6 }}>
                          SMS alerts are sent via your configured gateway (Africa's Talking, Twilio, etc.).
                          Standard carrier rates may apply. Only enabled alert types above will trigger an SMS.
                        </p>
                      </div>

                      {/* Per-type quick summary */}
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {[
                          { label: 'Low Stock', active: smsLowStock },
                          { label: 'Expiry',    active: smsExpiry },
                          { label: 'Daily Summary', active: smsDailySummary },
                        ].map(({ label, active }) => (
                          <span key={label} style={{
                            display: 'inline-flex', alignItems: 'center', gap: '5px',
                            padding: '3px 10px', borderRadius: 999, fontSize: '12px', fontWeight: 600,
                            background: active ? 'var(--status-success-bg)' : 'var(--bg-base)',
                            color: active ? 'var(--status-success)' : 'var(--text-muted)',
                            border: `1px solid ${active ? 'rgba(22,163,74,0.2)' : 'var(--border)'}`,
                          }}>
                            {active ? '✓' : '○'} {label}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Section>
            )}

            {/* APPEARANCE */}
            {tab === 'appearance' && (
              <Section title="Appearance" description="Customise the look and feel of your dashboard.">
                <SettingRow label="Theme" hint="Choose your preferred colour mode">
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {(['light', 'auto'] as const).map(t => (
                      <button key={t} onClick={() => setTheme(t)} style={{
                        padding: '6px 14px', borderRadius: 999,
                        border: theme === t ? '2px solid var(--accent)' : '1.5px solid var(--border-strong)',
                        background: theme === t ? 'var(--accent-light)' : 'var(--bg-card)',
                        color: theme === t ? 'var(--accent-dark)' : 'var(--text-secondary)',
                        fontWeight: 600, fontSize: '13px', cursor: 'pointer',
                        transition: 'all 150ms',
                      }}>
                        {t === 'light' ? '☀️ Light' : '🖥 System'}
                      </button>
                    ))}
                  </div>
                </SettingRow>
                <SettingRow label="Density" hint="Controls spacing between rows and elements">
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {(['comfortable', 'compact'] as const).map(d => (
                      <button key={d} onClick={() => setDensity(d)} style={{
                        padding: '6px 14px', borderRadius: 999,
                        border: density === d ? '2px solid var(--accent)' : '1.5px solid var(--border-strong)',
                        background: density === d ? 'var(--accent-light)' : 'var(--bg-card)',
                        color: density === d ? 'var(--accent-dark)' : 'var(--text-secondary)',
                        fontWeight: 600, fontSize: '13px', cursor: 'pointer',
                        transition: 'all 150ms',
                      }}>
                        {d === 'comfortable' ? 'Comfortable' : 'Compact'}
                      </button>
                    ))}
                  </div>
                </SettingRow>
              </Section>
            )}

            {/* DATA */}
            {tab === 'data' && (
              <Section title="Data & Backup" description="Manage exports, backups, and data retention.">
                {[
                  { label: 'Export Products',     hint: 'Download full product catalogue as CSV',        action: 'Export CSV' },
                  { label: 'Export Inventory',    hint: 'Download current stock levels and expiry data', action: 'Export CSV' },
                  { label: 'Export Sales Report', hint: 'Download POS transaction history',              action: 'Export CSV' },
                  { label: 'Export Procurement',  hint: 'Download all procurement orders',               action: 'Export CSV' },
                ].map(({ label, hint, action }) => (
                  <SettingRow key={label} label={label} hint={hint}>
                    <button className="btn-secondary" style={{ fontSize: '13px', padding: '6px 14px' }}
                      onClick={() => alert('Export feature coming soon.')}>
                      {action}
                      <ChevronRight size={14} />
                    </button>
                  </SettingRow>
                ))}
              </Section>
            )}

            {/* Save footer */}
            <div style={{
              display: 'flex', justifyContent: 'flex-end', gap: '12px',
              marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--border)',
            }}>
              <button className="btn-ghost" onClick={() => setTab(tab)}>Discard changes</button>
              <button className="btn-primary" onClick={handleSave}
                style={{ minWidth: '130px', justifyContent: 'center' }}>
                {saved
                  ? <><Check size={16} /> Saved</>
                  : <><Save size={16} /> Save changes</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
