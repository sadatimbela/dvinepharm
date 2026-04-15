'use client';

import { useState } from 'react';
import {
  BookOpen, MessageSquare, Zap, ShieldCheck, HeartPulse,
  Package, BarChart2, ShoppingCart, Layers, Truck,
  ChevronRight, ExternalLink,
} from 'lucide-react';
import Topbar from '@/components/Topbar';
import Link from 'next/link';

const FAQ = [
  {
    q: 'How do I add a new product to the catalogue?',
    a: 'Navigate to Products → click "Add Product". Fill in the name, barcode (optional — auto-generated if blank), unit price, category, and starting stock.',
  },
  {
    q: 'How does the POS transaction work?',
    a: 'In Point of Sale, search or scan items to add them to the cart. Apply a discount if needed, then click "Complete Transaction" to record the sale and deduct stock automatically.',
  },
  {
    q: 'What triggers a low‑stock alert?',
    a: 'Any product whose quantity drops below the threshold set in Settings → Pharmacy → Low Stock Threshold (default: 10 units).',
  },
  {
    q: 'How do I receive a procurement order into inventory?',
    a: 'Go to Procurement, fill in the supplier, product, quantity, and cost per unit, then click "Commit Stock Entry". The inventory levels will update automatically.',
  },
  {
    q: 'Can I export my sales data?',
    a: 'Yes. Go to Settings → Data & Backup, then click "Export CSV" next to Sales Report to download a full transaction history.',
  },
  {
    q: 'How do I change my password?',
    a: 'Go to Settings → Security. Enter your current password, then set and confirm a new one.',
  },
];

const QUICK_LINKS = [
  { label: 'Point of Sale',  href: '/pos',         icon: ShoppingCart, desc: 'Process customer transactions' },
  { label: 'Products',       href: '/products',    icon: Package,      desc: 'Manage your catalogue' },
  { label: 'Inventory',      href: '/inventory',   icon: Layers,       desc: 'Track stock and expiry' },
  { label: 'Procurement',    href: '/procurement', icon: Truck,        desc: 'Log supplier purchase orders' },
  { label: 'Reports',        href: '/reports',     icon: BarChart2,    desc: 'View sales and stock analytics' },
  { label: 'Settings',       href: '/settings',    icon: ShieldCheck,  desc: 'Manage account and preferences' },
];

export default function HelpPage() {
  return (
    <>
      <Topbar title="Help & Support" />

      <div style={{ maxWidth: '900px', display: 'flex', flexDirection: 'column', gap: '32px' }}>

        {/* ── Hero banner ── */}
        <div className="card-pharm" style={{
          padding: '36px 40px',
          background: 'linear-gradient(135deg, rgba(0,103,192,0.08) 0%, rgba(255,255,255,0.8) 60%)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
            <div style={{
              width: 48, height: 48, borderRadius: '14px',
              background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'var(--shadow-btn-primary)',
            }}>
              <HeartPulse size={24} color="#fff" strokeWidth={2} />
            </div>
            <div>
              <h1 className="heading-page" style={{ fontSize: '24px' }}>PharmERP Help Centre</h1>
              <p className="text-subtitle">Everything you need to run your pharmacy smoothly.</p>
            </div>
          </div>
        </div>

        {/* ── Quick navigation ── */}
        <div>
          <h2 className="heading-section" style={{ marginBottom: '16px' }}>Quick Navigation</h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '12px',
          }}>
            {QUICK_LINKS.map(({ label, href, icon: Icon, desc }) => (
              <Link key={href} href={href} style={{ textDecoration: 'none' }}>
                <div className="card-pharm" style={{
                  padding: '16px 20px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '14px',
                }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: '10px',
                    background: 'var(--accent-light)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--accent)', flexShrink: 0,
                  }}>
                    <Icon size={18} strokeWidth={1.5} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 600, fontSize: '14px', margin: 0, color: 'var(--text-primary)' }}>{label}</p>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0' }}>{desc}</p>
                  </div>
                  <ChevronRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Getting started ── */}
        <div>
          <h2 className="heading-section" style={{ marginBottom: '16px' }}>Getting Started</h2>
          <div className="card-pharm" style={{ padding: '0' }}>
            {[
              {
                step: '1',
                icon: Package,
                title: 'Add your products',
                body: 'Start in Products and catalogue every item you carry — name, barcode, price, and category.',
              },
              {
                step: '2',
                icon: Truck,
                title: 'Log your first procurement',
                body: 'Use Procurement to record supplier deliveries. Each committed order updates your live inventory.',
              },
              {
                step: '3',
                icon: ShoppingCart,
                title: 'Open the POS',
                body: 'Scan or search products, add them to a cart, and complete the transaction. Stock decrements automatically.',
              },
              {
                step: '4',
                icon: BarChart2,
                title: 'Review reports',
                body: 'Monitor sales trends, top-selling items, and inventory health in the Reports module.',
              },
            ].map(({ step, icon: Icon, title, body }, i, arr) => (
              <div key={step} style={{
                display: 'flex', gap: '20px', padding: '20px 24px',
                borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                  background: 'var(--accent)', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '14px',
                  boxShadow: 'var(--shadow-btn-primary)',
                }}>
                  {step}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <Icon size={16} style={{ color: 'var(--accent)' }} strokeWidth={1.8} />
                    <p style={{ fontWeight: 600, fontSize: '14px', margin: 0 }}>{title}</p>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── FAQ ── */}
        <div>
          <h2 className="heading-section" style={{ marginBottom: '16px' }}>
            Frequently Asked Questions
          </h2>
          <div className="card-pharm" style={{ padding: '0' }}>
            {FAQ.map(({ q, a }, i) => (
              <FaqItem key={i} question={q} answer={a} last={i === FAQ.length - 1} />
            ))}
          </div>
        </div>

        {/* ── Contact section ── */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px',
        }}>
          {[
            {
              icon: MessageSquare,
              title: 'Contact Support',
              body: 'Reach the PharmERP team for technical issues or billing inquiries.',
              action: 'Open ticket',
              href: 'mailto:support@pharmerp.app',
            },
            {
              icon: BookOpen,
              title: 'Documentation',
              body: 'Read full technical guides, API references, and admin walkthroughs.',
              action: 'Read docs',
              href: '#',
            },
          ].map(({ icon: Icon, title, body, action, href }) => (
            <div key={title} className="card-pharm" style={{ padding: '24px' }}>
              <div style={{
                width: 40, height: 40, borderRadius: '10px',
                background: 'var(--accent-light)', color: 'var(--accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '14px',
              }}>
                <Icon size={20} strokeWidth={1.5} />
              </div>
              <p style={{ fontWeight: 600, fontSize: '15px', margin: '0 0 6px' }}>{title}</p>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 16px', lineHeight: 1.6 }}>{body}</p>
              <a href={href} className="btn-secondary" style={{ fontSize: '13px', textDecoration: 'none' }}>
                {action}
                <ExternalLink size={14} />
              </a>
            </div>
          ))}
        </div>

        {/* ── Footer note ── */}
        <div style={{ textAlign: 'center', padding: '8px 0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '6px' }}>
            <Zap size={14} style={{ color: 'var(--accent)' }} />
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              PharmERP v1.0 — Clinical OS
            </span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
            Built for modern pharmacy operations. All data stays within your Supabase project.
          </p>
        </div>
      </div>
    </>
  );
}

/* ── Accordion FAQ item ── */
function FaqItem({ question, answer, last }: { question: string; answer: string; last: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ borderBottom: last ? 'none' : '1px solid var(--border)' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', padding: '16px 24px',
          border: 'none', background: 'none', cursor: 'pointer',
          textAlign: 'left', gap: '16px',
          transition: 'background 150ms',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-base)'}
        onMouseLeave={e => e.currentTarget.style.background = 'none'}
      >
        <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>{question}</span>
        <ChevronRight
          size={16}
          style={{
            color: 'var(--text-muted)', flexShrink: 0,
            transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 200ms cubic-bezier(0.2,0,0,1)',
          }}
        />
      </button>
      {open && (
        <div style={{ padding: '0 24px 16px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          {answer}
        </div>
      )}
    </div>
  );
}
