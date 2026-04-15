'use client';

import { Bell, Search, Menu, Sun, Moon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/hooks/useUIStore';

interface TopbarProps {
  title?: string;
  breadcrumb?: React.ReactNode;
}

export default function Topbar({ title, breadcrumb }: TopbarProps) {
  const { user } = useAuth();
  const { isSidebarCollapsed, isMobileOpen, toggleMobile, theme, toggleTheme } = useUIStore();

  const initials = user?.email
    ? user.email.substring(0, 2).toUpperCase()
    : 'PA';

  const topbarClass = `topbar ${isSidebarCollapsed ? 'topbar-expanded' : ''}`;
  const handleMobileToggle = () => {
    // #region agent log
    fetch('http://127.0.0.1:7566/ingest/c2169ce9-e1e9-4150-b7be-e63abfdacca3',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'71b753'},body:JSON.stringify({sessionId:'71b753',runId:'sidebar-toggle',hypothesisId:'H5',location:'components/Topbar.tsx:24',message:'mobile menu toggle pressed',data:{title:title??null,isMobileOpenBefore:isMobileOpen},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    toggleMobile();
  };

  return (
    <header className={topbarClass} role="banner">
      {/* ── Left: context area ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Mobile menu toggle */}
        <button 
          className="mobile-menu-toggle btn-icon" 
          onClick={handleMobileToggle}
          aria-label="Open navigation menu"
          aria-expanded={isMobileOpen}
          aria-controls="sidebar-nav"
          style={{ width: 44, height: 44 }}
        >
          <Menu size={18} strokeWidth={1.5} aria-hidden="true" />
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {breadcrumb ? (
            <nav aria-label="Breadcrumb" className="hidden sm:block">
              <div className="breadcrumb" style={{ marginBottom: 2 }}>{breadcrumb}</div>
            </nav>
          ) : (
            title && (
              <h1 className="heading-section" style={{ 
                fontSize: '15px', color: 'var(--text-primary)', margin: 0,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                maxWidth: '60vw'
              }}>
                {title}
              </h1>
            )
          )}
          {!breadcrumb && (
            <span className="text-meta" style={{ fontWeight: 500, fontSize: '11px', display: 'var(--mobile-date-display, block)' }}>
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>
      </div>

      {/* ── Right: utility area ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Command Search Bar - Only show on desktop (>= md) */}
        <div 
          className="hidden md:flex"
          style={{
            position: 'relative',
            alignItems: 'center',
            minWidth: '200px',
            flex: 1,
            maxWidth: '400px'
          }}
        >
          <label htmlFor="global-search" className="sr-only">Search PharmERP</label>
          <Search size={15} strokeWidth={1.5} style={{ 
            color: 'var(--text-muted)', position: 'absolute', left: 12, pointerEvents: 'none' 
          }} aria-hidden="true" />
          <input
            type="search"
            id="global-search"
            name="global-search"
            autoComplete="off"
            spellCheck={false}
            placeholder="Quick Search…"
            className="input-pharm"
            style={{ paddingLeft: '34px', paddingRight: '40px', height: '36px' }}
            aria-label="Quick search"
          />
          <div style={{
            position: 'absolute', right: '6px',
            background: 'var(--bg-base)', border: '1px solid var(--border)', 
            borderRadius: '4px', fontSize: '10px', padding: '2px 5px', 
            color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', 
            fontWeight: 600, pointerEvents: 'none',
          }} className="hidden lg:block" aria-hidden="true">
            ⌘K
          </div>
        </div>

        {/* Action buttons separator */}
        <div style={{ width: '1px', height: '16px', background: 'var(--border)', margin: '0 4px' }} className="hidden sm:block" aria-hidden="true" />

        {/* Theme toggle */}
        <button
          className="btn-icon"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          style={{ position: 'relative', width: 44, height: 44 }}
        >
          {theme === 'dark' ? <Sun size={18} strokeWidth={1.5} /> : <Moon size={18} strokeWidth={1.5} />}
        </button>

        {/* Notification bell */}
        <button
          className="btn-icon"
          aria-label="Notifications — 1 unread"
          style={{ position: 'relative', width: 44, height: 44 }}
        >
          <Bell size={18} strokeWidth={1.5} aria-hidden="true" />
          {/* Accessible dot with sr-only count */}
          <span aria-hidden="true" style={{
            position: 'absolute', top: '8px', right: '8px',
            width: 7, height: 7, borderRadius: '50%',
            background: 'var(--status-critical)', border: '2px solid var(--bg-card)',
          }} />
        </button>

        {/* User Avatar — button for future profile menu */}
        <button
          type="button"
          aria-label={`User profile: ${user?.user_metadata?.full_name || 'Admin'}`}
          style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'var(--accent)', boxSizing: 'border-box',
            border: '2px solid var(--bg-card)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '13px', fontWeight: 600, color: '#fff', cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            transition: 'transform 120ms ease',
            minWidth: 44, minHeight: 44,
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          onMouseDown={e => e.currentTarget.style.transform = 'scale(0.96)'}
          onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <span aria-hidden="true">{initials}</span>
        </button>
      </div>
    </header>
  );
}
