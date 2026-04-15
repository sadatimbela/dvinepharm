'use client';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
}

export function Skeleton({ className = '', width, height, borderRadius }: SkeletonProps) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width, height, borderRadius }}
    />
  );
}

/* ── Metric Card Skeleton ── */
export function MetricCardSkeleton() {
  return (
    <div className="metric-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Skeleton width={120} height={14} />
        <Skeleton width={32} height={32} borderRadius="8px" />
      </div>
      <Skeleton width={80} height={32} />
      <Skeleton width={60} height={12} />
    </div>
  );
}

/* ── Table Skeleton ── */
export function TableSkeleton({ rows = 8, columns = 6 }: { rows?: number; columns?: number }) {
  return (
    <div className="card-pharm" style={{ overflow: 'hidden' }}>
      {/* Header — sp-3 padding */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: '24px',
        padding: '12px 24px',
        borderBottom: '1px solid var(--border-strong)',
        background: 'var(--bg-base)',
      }}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} height={12} width={`${40 + Math.random() * 40}%`} />
        ))}
      </div>
      {/* Rows — 48px height match */}
      {Array.from({ length: rows }).map((_, row) => (
        <div key={row} style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: '24px',
          padding: '0 24px',
          height: '48px',
          alignItems: 'center',
          borderBottom: row < rows - 1 ? '1px solid var(--border)' : 'none',
        }}>
          {Array.from({ length: columns }).map((_, col) => (
            <Skeleton key={col} height={14} width={`${50 + Math.random() * 40}%`} />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ── Chart Skeleton ── */
export function ChartSkeleton() {
  return (
    <div className="card-pharm" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Skeleton width={140} height={16} />
          <Skeleton width={100} height={12} />
        </div>
        <Skeleton width={80} height={32} borderRadius="6px" />
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '200px' }}>
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton
            key={i}
            width="100%"
            height={`${30 + Math.random() * 70}%`}
            borderRadius="4px"
          />
        ))}
      </div>
    </div>
  );
}
