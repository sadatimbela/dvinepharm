'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShoppingCart, Package, BarChart2, Layers,
  HelpCircle, Settings, Truck, LogOut, Users, Activity,
  ChevronLeft, ChevronRight, X
} from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/hooks/useUIStore';

/* All nav items — role controls which ones render */
const NAV = [
  { href: '/pos',         label: 'Point of Sale', icon: ShoppingCart, roles: ['admin', 'staff', 'manager'] },
  { href: '/activity',    label: 'My Activity',   icon: Activity,     roles: ['staff', 'manager'] },
  { href: '/products',    label: 'Products',      icon: Package,      roles: ['admin', 'staff', 'manager'] },
  { href: '/inventory',   label: 'Inventory',     icon: Layers,       roles: ['admin', 'manager'] },
  { href: '/procurement', label: 'Procurement',   icon: Truck,        roles: ['admin', 'manager'] },
  { href: '/reports',     label: 'Reports',       icon: BarChart2,    roles: ['admin', 'manager'] },
  { href: '/staff',       label: 'Staff',         icon: Users,        roles: ['admin', 'manager'] },
];

const BOTTOM_NAV = [
  { href: '/help',     label: 'Help',     icon: HelpCircle, roles: ['admin', 'staff', 'manager'] },
  { href: '/settings', label: 'Settings', icon: Settings,   roles: ['admin', 'manager'] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, role, signOut } = useAuth();
  const { isSidebarCollapsed, isMobileOpen, toggleSidebar, closeMobile } = useUIStore();

  const initials = user?.email
    ? user.email.substring(0, 2).toUpperCase()
    : 'PA';

  const visibleNav       = NAV.filter(n => role && n.roles.includes(role));
  const visibleBottomNav = BOTTOM_NAV.filter(n => role && n.roles.includes(role));

  const sidebarClass = `sidebar ${isSidebarCollapsed ? 'sidebar-collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`;
  // #region agent log
  fetch('http://127.0.0.1:7566/ingest/c2169ce9-e1e9-4150-b7be-e63abfdacca3',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'71b753'},body:JSON.stringify({sessionId:'71b753',runId:'sidebar-render',hypothesisId:'H5',location:'components/Sidebar.tsx:43',message:'sidebar render state',data:{isMobileOpen,isSidebarCollapsed,pathname},timestamp:Date.now()})}).catch(()=>{});
  // #endregion

  return (
    <>
      {/* Mobile Overlay — traps focus context, click to close */}
      {isMobileOpen && (
        <div
          className="sidebar-overlay mobile-only"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      <nav
        className={sidebarClass}
        aria-label="Main navigation"
        id="sidebar-nav"
      >
        
        {/* ── Brand ── */}
        <div style={{
          padding: '24px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <Link
            href="/"
            style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}
            onClick={() => isMobileOpen && closeMobile()}
          >
            <Image
              src="/logo.png"
              alt="Logo"
              width={32}
              height={32}
              priority
              style={{ objectFit: 'contain' }}
            />
            <span className="sidebar-brand-text" style={{
              fontWeight: 700, fontSize: '18px', color: '#FFFFFF',
              lineHeight: 1.1, letterSpacing: '-0.02em',
            }}>
              Divine Pharmacy Operations
            </span>
          </Link>
          
          {/* Mobile Close Button */}
          {isMobileOpen && (
            <button
              className="mobile-menu-toggle"
              onClick={closeMobile}
              aria-label="Close navigation menu"
              style={{
                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
                color: '#fff', cursor: 'pointer', padding: '8px',
                borderRadius: '8px', display: 'flex', alignItems: 'center',
                minWidth: 44, minHeight: 44, justifyContent: 'center',
              }}
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* ── Role badge ── */}
        {role && !isSidebarCollapsed && (
          <div style={{ padding: '10px 20px 0' }} className="sidebar-label">
            <span
              aria-label={`Logged in as ${role}`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: (role === 'admin' || role === 'manager') ? '#93C5FD' : 'rgba(255,255,255,0.65)',
                background: (role === 'admin' || role === 'manager') ? 'rgba(99,155,255,0.12)' : 'rgba(255,255,255,0.06)',
                padding: '3px 8px', borderRadius: 999,
                border: `1px solid ${(role === 'admin' || role === 'manager') ? 'rgba(99,155,255,0.25)' : 'rgba(255,255,255,0.10)'}`,
              }}
            >
              {(role === 'admin' || role === 'manager') ? '⬡ Manager' : '◉ Staff'}
            </span>
          </div>
        )}

        {/* ── Primary Nav ── */}
        <div style={{ flex: 1, padding: '16px 0', overflowY: 'auto' }}>
          <p className="sidebar-label" style={{
            padding: '0 24px 10px',
            fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.08em', color: 'rgba(255,255,255,0.28)',
            margin: 0,
          }} aria-hidden="true">
            Menu
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {visibleNav.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(href + '/');
              return (
                <Link
                  key={href}
                  href={href}
                  className={`nav-item${active ? ' active' : ''}`}
                  onClick={() => isMobileOpen && closeMobile()}
                  aria-label={isSidebarCollapsed ? label : undefined}
                  aria-current={active ? 'page' : undefined}
                  title={isSidebarCollapsed ? label : undefined}
                >
                  <Icon size={18} strokeWidth={active ? 2.5 : 1.5} aria-hidden="true" />
                  <span className="sidebar-label">{label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ── Bottom Nav ── */}
        <div style={{ padding: '12px 0', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          {visibleBottomNav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link 
                key={label} 
                href={href} 
                className={`nav-item${active ? ' active' : ''}`}
                onClick={() => isMobileOpen && closeMobile()}
                aria-label={isSidebarCollapsed ? label : undefined}
                aria-current={active ? 'page' : undefined}
                title={isSidebarCollapsed ? label : undefined}
              >
                <Icon size={18} strokeWidth={active ? 2.5 : 1.5} aria-hidden="true" />
                <span className="sidebar-label">{label}</span>
              </Link>
            );
          })}

          {/* Collapse Toggle — Desktop toggles labels, Mobile closes drawer */}
          <button 
            className="nav-item flex w-full text-left"
            onClick={() => {
              if (isMobileOpen) closeMobile();
              else toggleSidebar();
            }}
            aria-expanded={!isSidebarCollapsed}
            aria-controls="sidebar-nav"
            style={{ 
              background: 'none', border: 'none', margin: '1px 10px', padding: '9px 12px',
              fontFamily: 'inherit', color: 'rgba(255, 255, 255, 0.52)'
            }}
            title={isMobileOpen ? "Close Menu" : isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            aria-label={isMobileOpen ? "Close Menu" : isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isMobileOpen ? <ChevronLeft size={18} strokeWidth={1.5} aria-hidden="true" /> : isSidebarCollapsed ? <ChevronRight size={18} strokeWidth={1.5} aria-hidden="true" /> : <ChevronLeft size={18} strokeWidth={1.5} aria-hidden="true" />}
            <span className="sidebar-label">{isMobileOpen ? 'Close Menu' : 'Collapse'}</span>
          </button>

          {/* ── User strip ── */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: isSidebarCollapsed ? '10px' : '10px 12px', 
            margin: '14px 12px 4px',
            borderRadius: '12px',
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.10)',
            backdropFilter: 'blur(8px)',
            justifyContent: isSidebarCollapsed ? 'center' : 'flex-start'
          }}>
            <div
              aria-label={`User: ${user?.user_metadata?.full_name || user?.email || 'Admin'}`}
              style={{
                width: 32, height: 32, borderRadius: '8px',
                background: 'var(--accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '12px', fontWeight: 700, color: '#fff', flexShrink: 0,
                boxShadow: '0 2px 8px rgba(0,103,192,0.4)',
              }}
              title={isSidebarCollapsed ? user?.email || 'User' : undefined}
            >
              {initials}
            </div>

            {!isSidebarCollapsed && (
              <>
                <div style={{ overflow: 'hidden', flex: 1 }}>
                  <p style={{
                    fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.88)',
                    lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    margin: 0,
                  }}>
                    {user?.user_metadata?.full_name || 'Admin'}
                  </p>
                </div>

                <button
                  onClick={() => signOut()}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'rgba(255,255,255,0.45)', padding: '8px',
                    display: 'flex', alignItems: 'center',
                    transition: 'all 150ms', borderRadius: '6px',
                    minWidth: 36, minHeight: 36, justifyContent: 'center',
                  }}
                  aria-label="Sign out"
                  title="Sign out"
                  onMouseEnter={e => {
                    e.currentTarget.style.color = '#FCA5A5';
                    e.currentTarget.style.background = 'rgba(239,68,68,0.15)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = 'rgba(255,255,255,0.45)';
                    e.currentTarget.style.background = 'none';
                  }}
                >
                  <LogOut size={16} aria-hidden="true" />
                </button>
              </>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}
