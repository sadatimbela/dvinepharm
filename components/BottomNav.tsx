'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCart, Package, Layers, BarChart2, Users, Activity } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const MOBILE_NAV = [
  { href: '/pos',       label: 'POS',       icon: ShoppingCart, roles: ['admin', 'staff', 'manager'] },
  { href: '/activity',  label: 'Activity',  icon: Activity,     roles: ['staff', 'manager'] },
  { href: '/products',  label: 'Products',  icon: Package,      roles: ['admin', 'staff', 'manager'] },
  { href: '/inventory', label: 'Inventory', icon: Layers,       roles: ['admin', 'manager'] },
  { href: '/reports',   label: 'Reports',   icon: BarChart2,    roles: ['admin', 'manager'] },
  { href: '/staff',     label: 'Staff',     icon: Users,        roles: ['admin', 'manager'] },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { role } = useAuth();

  const visibleNav = MOBILE_NAV.filter(n => role && n.roles.includes(role)).slice(0, 5); // Max 5 items looks best

  if (visibleNav.length === 0) return null;

  return (
    <nav className="bottom-nav hide-on-desktop" aria-label="Mobile Navigation">
      {visibleNav.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + '/');
        return (
          <Link
            key={href}
            href={href}
            className={`bottom-nav-item ${active ? 'active' : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            <Icon size={22} strokeWidth={active ? 2.5 : 1.8} aria-hidden="true" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
