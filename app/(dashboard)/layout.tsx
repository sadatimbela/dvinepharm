'use client';

import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import PageTransition from '@/components/PageTransition';
import BottomNav from '@/components/BottomNav';
import SecurityPrompt from '@/components/SecurityPrompt';
import { ReactNode, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/hooks/useUIStore';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/* Routes only admins may visit */
const ADMIN_ONLY_ROUTES = [
  '/inventory',
  '/procurement',
  '/reports',
  '/settings',
  '/staff',
];

const ROUTE_TITLES: Record<string, string> = {
  '/pos': 'Point of Sale',
  '/activity': 'My Activity',
  '/products': 'Products & Catalog',
  '/inventory': 'Inventory Hub',
  '/procurement': 'Procurement & Restock',
  '/reports': 'Analytics & Reports',
  '/staff': 'Staff Management',
  '/settings': 'System Settings'
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { session, role, isLoading, isPasscodeVerified } = useAuth();
  const { isSidebarCollapsed, closeMobile } = useUIStore();
  const router   = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    /* Not logged in → login */
    if (!session) { router.push('/login'); return; }

    /* If not Admin/Manager trying to access restricted route → redirect to POS */
    const isRestrictedPath = ADMIN_ONLY_ROUTES.some(r => pathname.startsWith(r));
    if (isRestrictedPath && role !== 'admin' && role !== 'manager') {
      router.push('/pos');
    }
  }, [session, role, isLoading, pathname, router]);

  // Close mobile sidebar on route change
  useEffect(() => {
    closeMobile();
  }, [pathname, closeMobile]);

  console.log('🏗️ DashboardLayout: State -', { isLoading, hasSession: !!session, isPasscodeVerified });

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-base)', gap: '16px',
      }}>
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes loading-fade-in {
            from { opacity: 0; transform: translateY(8px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          .loading-wrapper {
            animation: loading-fade-in 400ms cubic-bezier(0.16, 1, 0.3, 1) both;
            display: flex; flex-direction: column; align-items: center; gap: 16px;
          }
        `}</style>
        <div className="loading-wrapper">
          <Loader2 size={36} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>
            Loading workspace…
          </span>
        </div>
      </div>
    );
  }

  if (!session) return null;

  // Show Security Prompt if not passcode-verified
  if (!isPasscodeVerified) {
    return <SecurityPrompt />;
  }

  const pageTitle = Object.keys(ROUTE_TITLES).find(k => pathname.startsWith(k)) 
    ? ROUTE_TITLES[Object.keys(ROUTE_TITLES).find(k => pathname.startsWith(k)) as string]
    : '';

  const contentClass = `main-content ${isSidebarCollapsed ? 'content-expanded' : ''}`;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <Sidebar />
      <Topbar title={pageTitle} />
      <main id="main-content" className={contentClass}>
        <PageTransition>
          {children}
        </PageTransition>
      </main>
      <BottomNav />
    </div>
  );
}
