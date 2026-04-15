'use client';

import React, { useState } from 'react';
import { ShoppingBag, Minus, Plus, Trash2, ArrowRight, Loader2, Tag, CreditCard, CheckCircle2, Share2, MessageSquare, X as XIcon } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { formatCurrency } from '@/utils/currency';
import { supabase } from '@/utils/supabase';

export function CartPanel() {
  const { items, total, updateQuantity, removeItem, clearCart, processSale, lastSale, resetLastSale } = useCartStore();
  const [discount, setDiscount] = useState('0');
  const [isProcessing, setIsProcessing] = useState(false);

  const finalTotal = total - parseInt(discount || '0');

  const handlePay = async () => {
    setIsProcessing(true);
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      alert("Please log in to process sales.");
      setIsProcessing(false);
      return;
    }
    const success = await processSale(userId, finalTotal);
    if (!success) {
      alert("Transaction failed. Please try again.");
    }
    setIsProcessing(false);
  };

  const shareReceiptWhatsApp = () => {
    if (!lastSale) return;
    const itemsText = lastSale.items.map((i: any) => `*${i.name}* x ${i.quantity} — ${formatCurrency(i.subtotal)}`).join('%0A');
    const message = `*DIVINEPHARM RECEIPT*%0A---------------------------%0ADate: ${new Date(lastSale.timestamp).toLocaleString()}%0AOrder ID: ${lastSale.id.substring(0,8).toUpperCase()}%0A%0A${itemsText}%0A---------------------------%0A*TOTAL: ${formatCurrency(lastSale.total_amount)}*%0A%0A_Thank you for trusting Divinepharm!_`;
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  if (lastSale) {
    return (
      <div className="cart-panel-sticky" style={{ position: 'sticky', top: '88px', height: 'calc(100vh - 120px)' }}>
        <div className="card-pharm" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px', textAlign: 'center' }}>
          <div style={{ background: 'var(--status-success-bg)', color: 'var(--status-success)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            <CheckCircle2 size={32} />
          </div>
          <h2 className="heading-section" style={{ fontSize: '20px', marginBottom: '8px' }}>Sale Successful!</h2>
          <p className="text-secondary" style={{ fontSize: '14px', marginBottom: '24px' }}>Receipt generated for {formatCurrency(lastSale.total_amount)}</p>
          
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button onClick={shareReceiptWhatsApp} className="btn-primary" style={{ width: '100%', justifyContent: 'center', background: '#25D366', border: 'none' }}>
              <MessageSquare size={18} />
              Share on WhatsApp
            </button>
            <button className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
              <Share2 size={18} />
              Standard Share
            </button>
            <button onClick={resetLastSale} className="btn-ghost" style={{ marginTop: '12px' }}>
              <XIcon size={16} /> New Transaction
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-panel-sticky" style={{
      position: 'sticky', top: '88px',
      height: 'calc(100vh - 120px)',
      display: 'flex', flexDirection: 'column',
    }}>
      <div className="card-pharm" style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* -- Cart Header -- */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              aria-hidden="true"
              style={{
                width: 38, height: 38, borderRadius: '10px',
                background: 'var(--accent-light)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--accent)',
              }}
            >
              <ShoppingBag size={20} strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="heading-section" style={{ fontSize: '18px' }}>
                Current Order
              </h2>
              <p className="text-meta" style={{ marginTop: '2px' }} aria-live="polite">
                {items.length} item{items.length !== 1 ? 's' : ''} in cart
              </p>
            </div>
          </div>
          <button
            onClick={clearCart}
            className="btn-ghost"
            style={{ padding: '10px', border: 'none', color: 'var(--text-muted)', minWidth: 44, minHeight: 44 }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--status-critical)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
            aria-label="Clear current order"
          >
            <Trash2 size={18} aria-hidden="true" />
          </button>
        </div>

        {/* -- Cart Items -- */}
        <div style={{
          flex: 1, overflowY: 'auto', padding: '16px',
          display: 'flex', flexDirection: 'column', gap: '8px',
          background: 'var(--bg-base)',
        }}>
          {items.length === 0 ? (
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-muted)', gap: '12px',
              padding: '48px 24px',
            }}>
              <ShoppingBag size={48} strokeWidth={1} style={{ opacity: 0.3 }} aria-hidden="true" />
              <div style={{ textAlign: 'center' }}>
                <p className="empty-state-title" style={{ fontSize: '15px' }}>Your cart is empty</p>
                <p className="empty-state-desc" style={{ fontSize: '13px' }}>Scan or search items to proceed.</p>
              </div>
            </div>
          ) : (
            items.map((item) => <CartItem key={item.id} item={item} updateQuantity={updateQuantity} />)
          )}
        </div>

        {/* -- Payment Summary -- */}
        <div style={{
          padding: '24px', borderTop: '1px solid var(--border-strong)',
          background: 'rgba(255, 255, 255, 0.4)',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Line items details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--text-secondary)' }}>
                <span>Subtotal</span>
                <span className="tabular" style={{ fontWeight: 500 }}>{formatCurrency(total)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                  <Tag size={14} style={{ opacity: 0.7 }} aria-hidden="true" />
                  <label htmlFor="cart-discount" style={{ color: 'var(--text-secondary)', fontSize: '14px', cursor: 'default' }}>
                    Discount
                  </label>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }} aria-hidden="true">TZS</span>
                  <input
                    id="cart-discount"
                    type="number"
                    min="0"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    className="input-pharm"
                    aria-label="Discount amount in TZS"
                    style={{
                      width: '90px', textAlign: 'right', height: '36px',
                      padding: '4px 8px', fontSize: '14px', fontWeight: 600,
                      background: 'var(--bg-base)',
                    }}
                  />
                </div>
              </div>
            </div>

            <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} aria-hidden="true" />

            {/* Total */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
            }}>
              <div>
                <p style={{
                  fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)',
                  textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0
                }}>
                  Net Payable
                </p>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500, margin: 0 }}>
                  Order #POS-{Math.floor(Date.now()/100000 % 10000)}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{
                  fontSize: '32px', fontWeight: 700, color: 'var(--text-primary)',
                  fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em',
                  lineHeight: 1,
                }}>
                  {formatCurrency(finalTotal)}
                </span>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0', fontWeight: 500 }}>
                  Tax included
                </p>
              </div>
            </div>

            <button
              onClick={handlePay}
              disabled={items.length === 0 || isProcessing}
              aria-disabled={items.length === 0 || isProcessing}
              aria-busy={isProcessing}
              className="btn-primary"
              style={{
                width: '100%', justifyContent: 'center',
                marginTop: '8px', padding: '12px 24px', fontSize: '15px',
              }}
            >
              {isProcessing ? (
                <><span>Processing</span> <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} aria-hidden="true" /></>
              ) : (
                <>
                  <CreditCard size={18} aria-hidden="true" />
                  Complete Transaction
                  <ArrowRight size={18} style={{ marginLeft: '4px' }} aria-hidden="true" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CartItem({ item, updateQuantity }: { item: any; updateQuantity: any }) {
  const [h, setH] = useState(false);
  return (
    <div
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '12px 14px',
        background: h ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.6)',
        border: '1px solid',
        borderColor: h ? 'var(--accent-mid)' : 'var(--border-strong)',
        transition: 'all 200ms cubic-bezier(0.2, 0, 0, 1)',
        boxShadow: h ? 'var(--shadow-xs)' : 'none',
        borderRadius: 'var(--r-md)',
        transform: h ? 'scale(1.005)' : 'scale(1)'
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)',
          margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {item.name}
        </p>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0', fontWeight: 500 }}>
          {formatCurrency(item.price)} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>/ unit</span>
        </p>
      </div>

      {/* Quantity counter */}
      <div
        role="group"
        aria-label={`Quantity for ${item.name}`}
        style={{
          display: 'flex', alignItems: 'center', gap: '2px',
          background: 'var(--bg-base)', borderRadius: '8px', padding: '3px',
          border: '1px solid var(--border)',
        }}
      >
        <CartQtyBtn
          onClick={() => updateQuantity(item.id, -1)}
          icon={<Minus size={14} aria-hidden="true" />}
          label={`Decrease quantity of ${item.name}`}
        />
        <span
          aria-label={`${item.quantity} units`}
          style={{
            width: '32px', textAlign: 'center',
            fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {item.quantity}
        </span>
        <CartQtyBtn
          onClick={() => updateQuantity(item.id, 1)}
          icon={<Plus size={14} aria-hidden="true" />}
          label={`Increase quantity of ${item.name}`}
          active
        />
      </div>

      <div style={{ textAlign: 'right', width: '90px' }}>
        <span style={{
          fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {formatCurrency(item.price * item.quantity)}
        </span>
      </div>
    </div>
  );
}

function CartQtyBtn({
  icon, onClick, active, label
}: {
  icon: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  label?: string;
}) {
  const [h, setH] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      aria-label={label}
      style={{
        width: 36, height: 36, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        background: h ? (active ? 'var(--accent-mid)' : 'var(--border)') : 'transparent',
        border: 'none', cursor: 'pointer',
        borderRadius: '6px', color: h ? 'var(--accent)' : 'var(--text-secondary)',
        transition: 'all 120ms',
      }}
    >
      {icon}
    </button>
  );
}
