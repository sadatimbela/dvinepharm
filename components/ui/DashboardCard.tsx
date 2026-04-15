'use client';

import React, {
  useState, useEffect, useRef, ReactNode, CSSProperties,
} from 'react';

/* ─────────────────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────────────────── */
export type CardVariant = 'critical' | 'operational' | 'informational' | 'default';

export interface DashboardCardProps {
  /** Card semantic type — drives colour palette + animation behaviour */
  variant?: CardVariant;
  /** Short descriptor shown above the value */
  label: string;
  /** Primary metric value (number animates via count-up on operational cards) */
  value: number | string;
  /** Secondary annotation / sub-text */
  sub?: string;
  /** Optional change label (e.g. "+14.2%") */
  change?: string;
  /** true = change is positive (green), false = negative (red) */
  changeUp?: boolean;
  /** Icon rendered inside the coloured chip */
  icon?: ReactNode;
  iconBg?: string;
  iconColor?: string;
  /** Stagger delay in ms (informational cards) */
  delay?: number;
  /** Override value colour */
  valueColor?: string;
  /** Extra inline styles on the root card */
  style?: CSSProperties;
  /** Click handler — enables expand-on-click for informational cards */
  onClick?: () => void;
  /** Whether this card is currently in "expanded" state */
  expanded?: boolean;
  children?: ReactNode;
}

/* ─────────────────────────────────────────────────────────────────────────
   GRADIENT PRESETS — one per variant
   Using beautiful, vibrant pastel gradients
───────────────────────────────────────────────────────────────────────── */
const GRADIENTS: Record<CardVariant, string> = {
  critical:      'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)', // Warm pinkish flame
  operational:   'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)', // Winter Neva sky blue
  informational: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)', // Plum plate purple-blue
  default:       'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)', // Soft silver
};

const GLOW_COLORS: Record<CardVariant, string> = {
  critical:      'rgba(239,68,68,0.18)',
  operational:   'rgba(0,103,192,0.12)',
  informational: 'rgba(100,116,139,0.10)',
  default:       'transparent',
};

/* ─────────────────────────────────────────────────────────────────────────
   COUNT-UP HOOK  (for operational cards with numeric values)
───────────────────────────────────────────────────────────────────────── */
function useCountUp(target: number, duration = 900, delay = 0): number {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let raf: number;
    const t = setTimeout(() => {
      const start = performance.now();
      const step = (now: number) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        setCount(Math.round(eased * target));
        if (progress < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }, delay);
    return () => { clearTimeout(t); cancelAnimationFrame(raf); };
  }, [target, duration, delay]);
  return count;
}

/* ─────────────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────────────── */
export function DashboardCard({
  variant = 'default',
  label,
  value,
  sub,
  change,
  changeUp,
  icon,
  iconBg,
  iconColor,
  delay = 0,
  valueColor,
  style,
  onClick,
  expanded,
  children,
}: DashboardCardProps) {
  const isNumeric = typeof value === 'number';
  const numericTarget = isNumeric ? (value as number) : 0;

  /* Count-up (operational only) */
  const counted = useCountUp(
    variant === 'operational' && isNumeric ? numericTarget : 0,
    800,
    delay,
  );

  /* Stagger visibility (informational) */
  const [visible, setVisible] = useState(variant !== 'informational');
  useEffect(() => {
    if (variant === 'informational') {
      const t = setTimeout(() => setVisible(true), delay);
      return () => clearTimeout(t);
    }
  }, [variant, delay]);

  /* Hover state */
  const [hovered, setHovered] = useState(false);

  /* Build displayed value */
  const displayValue =
    variant === 'operational' && isNumeric
      ? counted.toLocaleString()
      : isNumeric
      ? (value as number).toLocaleString()
      : String(value);

  /* ── Root card styles ── */
  const cardStyle: CSSProperties = {
    position: 'relative',
    background: GRADIENTS[variant],
    backdropFilter: 'blur(24px) saturate(160%)',
    WebkitBackdropFilter: 'blur(24px) saturate(160%)',
    border: '1px solid transparent',
    backgroundClip: 'padding-box',
    borderRadius: '12px',
    padding: '20px 22px',
    cursor: onClick ? 'pointer' : 'default',
    overflow: 'hidden',

    /* Lift on hover for operational */
    transform:
      variant === 'operational' && hovered
        ? 'translateY(-4px) scale(1.008)'
        : 'none',

    /* Layered box-shadow: glow (variant-specific) + elevation shadow */
    boxShadow: [
      variant !== 'default' && hovered
        ? `0 0 0 2px ${GLOW_COLORS[variant]}, 0 12px 32px ${GLOW_COLORS[variant]}`
        : `0 0 0 1px rgba(255,255,255,0.6)`,
      '0 4px 16px rgba(0,0,0,0.04)',
      'inset 0 1px 0 rgba(255,255,255,0.88)',
    ].filter(Boolean).join(', '),

    transition:
      'transform 320ms cubic-bezier(0.34,1.56,0.64,1), box-shadow 280ms ease, opacity 380ms ease',

    /* Informational — fade-in stagger */
    opacity: visible ? 1 : 0,

    ...style,
  };

  /* ── Pulse ring for critical cards ── */
  const PulseRing = variant === 'critical' ? (
    <span
      aria-hidden
      style={{
        position: 'absolute',
        top: 16, right: 16,
        width: 8, height: 8,
        borderRadius: '50%',
        background: 'var(--status-critical)',
        boxShadow: `0 0 0 0 rgba(196,43,28,0.5)`,
        animation: 'card-pulse 2.4s ease-in-out infinite',
      }}
    />
  ) : null;

  /* ── Ambient glow layer for critical cards ── */
  const GlowLayer = (variant === 'critical' || variant === 'operational') ? (
    <span
      aria-hidden
      style={{
        position: 'absolute',
        bottom: -30, right: -30,
        width: 140, height: 140,
        borderRadius: '50%',
        background: GLOW_COLORS[variant],
        filter: 'blur(32px)',
        pointerEvents: 'none',
        zIndex: 0,
        transition: 'opacity 400ms',
        opacity: hovered ? 1 : 0.5,
        animation: variant === 'critical' ? 'card-glow-breath 3s ease-in-out infinite' : undefined,
      }}
    />
  ) : null;

  return (
    <div
      style={cardStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter') onClick(); } : undefined}
    >
      <span
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 'inherit',
          padding: 1,
          backgroundImage: variant === 'critical'
            ? 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,180,180,0.5) 50%, rgba(196,43,28,0.15) 100%)'
            : variant === 'operational'
            ? 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(180,215,255,0.6) 50%, rgba(0,103,192,0.12) 100%)'
            : 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(200,215,235,0.4) 50%, rgba(148,163,184,0.15) 100%)',
          WebkitMaskImage: 'linear-gradient(#fff 0 0), linear-gradient(#fff 0 0)',
          WebkitMaskClip: 'content-box, border-box',
          WebkitMaskComposite: 'xor',
          maskImage: 'linear-gradient(#fff 0 0), linear-gradient(#fff 0 0)',
          maskClip: 'content-box, border-box',
          maskComposite: 'exclude',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {GlowLayer}
      {PulseRing}

      {/* ── Content ── */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{
            fontSize: 12, fontWeight: 600, color: 'rgba(15, 23, 42, 0.7)',
            textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            {label}
          </span>
          {icon && (
            <div style={{
              width: 42, height: 42, borderRadius: '14px', // 20px icon + 11px padding = 42px
              background: iconBg ?? 'rgba(255,255,255,0.4)',
              color: iconColor ?? '#1e293b',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              boxShadow: variant === 'critical' ? '0 4px 12px rgba(196,43,28,0.15)' : '0 4px 12px rgba(0,0,0,0.06)',
              transition: 'transform 200ms',
              transform: hovered && variant === 'operational' ? 'scale(1.08) rotate(-3deg)' : 'scale(1)',
              backdropFilter: 'blur(8px)',
            }}>
              {/* Ensure child icons are properly scaled to standard size by default */}
              {React.cloneElement(icon as React.ReactElement, { size: 20, strokeWidth: 1.5 } as any)}
            </div>
          )}
        </div>

        {/* Primary value */}
        <div style={{
          fontSize: 30, fontWeight: 700, letterSpacing: '-0.04em',
          color: valueColor ?? '#1e293b',
          lineHeight: 1.1,
          fontVariantNumeric: 'tabular-nums',
          marginBottom: 4,
          transition: 'color 200ms',
        }}>
          {displayValue}
        </div>

        {/* Sub / change line */}
        {(sub || change) && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 12, fontWeight: 500,
            color: change
              ? (changeUp ? '#065f46' : '#991b1b')
              : 'rgba(15, 23, 42, 0.65)',
            marginTop: 4,
          }}>
            {change && (
              <span style={{
                display: 'inline-flex', alignItems: 'center',
                background: changeUp ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                color: changeUp ? '#065f46' : '#991b1b',
                borderRadius: 999, padding: '2px 7px', fontWeight: 700,
              }}>
                {changeUp ? '↑' : '↓'} {change}
              </span>
            )}
            {sub && <span style={{ color: 'rgba(15, 23, 42, 0.65)' }}>{sub}</span>}
          </div>
        )}

        {/* Expandable slot (informational) */}
        {expanded && children && (
          <div style={{
            marginTop: 14, paddingTop: 14,
            borderTop: '1px solid var(--border)',
            animation: 'card-expand 260ms cubic-bezier(0.16,1,0.3,1) both',
          }}>
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   KEYFRAMES — injected once as a global style tag
   (Avoids duplicating in globals.css if component is used standalone)
───────────────────────────────────────────────────────────────────────── */
export function DashboardCardStyles() {
  return (
    <style>{`
      @keyframes card-pulse {
        0%   { box-shadow: 0 0 0 0   rgba(196,43,28,0.50); }
        60%  { box-shadow: 0 0 0 8px rgba(196,43,28,0.00); }
        100% { box-shadow: 0 0 0 0   rgba(196,43,28,0.00); }
      }
      @keyframes card-glow-breath {
        0%,100% { opacity: 0.35; transform: scale(1); }
        50%     { opacity: 0.65; transform: scale(1.08); }
      }
      @keyframes card-expand {
        from { opacity:0; transform:translateY(-6px); }
        to   { opacity:1; transform:translateY(0); }
      }
      @keyframes card-fade-in {
        from { opacity:0; transform:translateY(10px) scale(0.98); }
        to   { opacity:1; transform:translateY(0) scale(1); }
      }
    `}</style>
  );
}
