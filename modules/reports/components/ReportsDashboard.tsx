import React, { useState, useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/utils/db';
import {
  TrendingUp, ShoppingCart, Target, ArrowUpRight, ArrowDownRight,
  BarChart3, Package, Activity, Filter, Download, RefreshCw,
  Calendar, ChevronDown, X, Search, Layers, Truck,
  Receipt, Banknote, Zap,
} from 'lucide-react';
import { formatCurrency } from '@/utils/currency';
import { MetricCardSkeleton, ChartSkeleton } from '@/components/ui/Skeleton';
import { DashboardCard, DashboardCardStyles } from '@/components/ui/DashboardCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { useSettingsStore } from '@/stores/useSettingsStore';

/* ══════════════════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════════════════ */
type DateRange  = 'today' | '7d' | '30d' | '90d' | 'ytd' | 'custom';
type ReportTab  = 'overview' | 'sales' | 'inventory' | 'procurement';
type GroupBy    = 'day' | 'week' | 'month';
type SortField  = 'revenue' | 'quantity' | 'name';

interface Filters {
  dateRange: DateRange;
  customFrom: string;
  customTo: string;
  groupBy: GroupBy;
  category: string;
  minRevenue: string;
  search: string;
  sortBy: SortField;
  sortDir: 'asc' | 'desc';
  showLowStock: boolean;
  showExpired: boolean;
}

const defaultFilters: Filters = {
  dateRange: '7d',
  customFrom: '',
  customTo: '',
  groupBy: 'day',
  category: 'all',
  minRevenue: '',
  search: '',
  sortBy: 'revenue',
  sortDir: 'desc',
  showLowStock: false,
  showExpired: false,
};

const DATE_RANGE_LABELS: Record<DateRange, string> = {
  today: 'Today',
  '7d':  'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
  ytd:   'Year to date',
  custom:'Custom range',
};

const CATEGORIES = ['all', 'General', 'Antibiotics', 'Analgesics', 'Antidiabetics', 'Supplements'];

/* ══════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════ */
export function ReportsDashboard() {
  const [tab, setTab] = useState<ReportTab>('overview');
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const { currency } = useSettingsStore();

  // ─── Dexie Live Queries (Offline-First) ───
  const inventoryItems = useLiveQuery(() => db.inventory.toArray()) || [];
  const products = useLiveQuery(() => db.products.toArray()) || [];
  const allSales = useLiveQuery(() => db.sales.toArray()) || [];

  const isLoading = !products.length && !inventoryItems.length && !allSales.length;

  // Aggregate stats locally from Dexie data
  const trends = useMemo(() => {
    return {
      txns: allSales.length,
      revenue: allSales.reduce((sum, s) => sum + s.total_amount, 0)
    };
  }, [allSales]);

  const rawSummaryData = useMemo(() => {
    if (!allSales) return [];
    const groups = new Map<string, { sale_date: string, total_revenue: number, total_transactions: number }>();
    allSales.forEach(s => {
      // Defensive check: skip records with missing or invalid timestamps
      if (!s.created_at || typeof s.created_at !== 'string') return;
      
      const d = s.created_at.split('T')[0];
      const existing = groups.get(d) || { sale_date: d, total_revenue: 0, total_transactions: 0 };
      existing.total_revenue += s.total_amount;
      existing.total_transactions += 1;
      groups.set(d, existing);
    });
    return Array.from(groups.values()).sort((a, b) => b.sale_date.localeCompare(a.sale_date));
  }, [allSales]);

  const chartData = useMemo(() => {
    if (!rawSummaryData.length) return [];
    let aggregated = new Map<string, number>();

    rawSummaryData.forEach((row) => {
      const date = new Date(row.sale_date);
      let groupKey = 'Unknown';

      if (filters.groupBy === 'day') {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        groupKey = days[date.getDay()];
      } else if (filters.groupBy === 'week') {
        const weekNum = Math.ceil(date.getDate() / 7);
        groupKey = `W${weekNum}`;
      } else if (filters.groupBy === 'month') {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        groupKey = months[date.getMonth()];
      }
      aggregated.set(groupKey, (aggregated.get(groupKey) || 0) + (row.total_revenue || 0));
    });

    if (aggregated.size === 0) return [{ label: 'Jan', value: 0 }];
    return Array.from(aggregated.entries()).map(([label, value]) => ({ label, value })).reverse(); 
  }, [filters.groupBy, rawSummaryData]);

  const topProducts = useMemo(() => {
    if (!allSales.length || !products.length) return [];
    
    const productStats = new Map<string, { qty: number, revenue: number }>();
    
    allSales.forEach(sale => {
      if (sale.items) {
        sale.items.forEach(item => {
          const stats = productStats.get(item.product_id) || { qty: 0, revenue: 0 };
          stats.qty += item.quantity;
          stats.revenue += item.quantity * item.unit_price;
          productStats.set(item.product_id, stats);
        });
      }
    });

    const sorted = Array.from(productStats.entries())
      .map(([id, stats]) => {
        const p = products.find(prod => prod.id === id);
        return {
          id,
          name: p?.name || 'Unknown Item',
          category: p?.category || 'General',
          ...stats
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    const maxRevenue = sorted.length > 0 ? sorted[0].revenue : 1;
    return sorted.map(s => ({
      ...s,
      pct: Math.round((s.revenue / maxRevenue) * 100)
    }));
  }, [allSales, products]);

  async function loadData(force?: boolean) {
    setIsRefreshing(true);
    setLastUpdated(new Date());
    setTimeout(() => setIsRefreshing(false), 500);
  }

  useEffect(() => { loadData(); }, []);

  /* ─── Derived / filtered product list ─── */
  const filteredProducts = useMemo(() => {
    let list = [...topProducts];
    if (filters.category !== 'all') list = list.filter(p => p.category === filters.category);
    if (filters.search)             list = list.filter(p => p.name.toLowerCase().includes(filters.search.toLowerCase()));
    if (filters.minRevenue)         list = list.filter(p => p.revenue >= Number(filters.minRevenue));
    list.sort((a, b) => {
      const dir = filters.sortDir === 'asc' ? 1 : -1;
      if (filters.sortBy === 'name')     return dir * a.name.localeCompare(b.name);
      if (filters.sortBy === 'quantity') return dir * (a.qty - b.qty);
      return dir * (a.revenue - b.revenue);
    });
    return list;
  }, [topProducts, filters]);

  const activeFilterCount = [
    filters.category !== 'all',
    !!filters.minRevenue,
    !!filters.search,
    filters.showLowStock,
    filters.showExpired,
    filters.groupBy !== 'day',
    filters.sortBy !== 'revenue',
  ].filter(Boolean).length;

  function patchFilter(patch: Partial<Filters>) {
    setFilters(f => ({ ...f, ...patch }));
  }

  return (
    <>
      <DashboardCardStyles />
      <div style={{ maxWidth: '1320px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* ══ HEADER ROW ══ */}
        <PageHeader 
          title="Reports & Analytics"
          subtitle={
            <>
              Real-time analytics across sales, procurement, and inventory.
              {' '}<span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                Updated {lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </>
          }
          icon={<BarChart3 />}
          iconBg="linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)"
          iconColor="#db2777"
          actions={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
            {/* Date range pill */}
            <div style={{ position: 'relative' }}>
              <button
                className="btn-secondary"
                onClick={() => setShowDatePicker(v => !v)}
                style={{ gap: '8px', minHeight: 44 }}
                aria-haspopup="listbox"
                aria-expanded={showDatePicker}
                aria-label={`Date range: ${DATE_RANGE_LABELS[filters.dateRange]}`}
              >
                <Calendar size={14} aria-hidden="true" />
                {DATE_RANGE_LABELS[filters.dateRange]}
                <ChevronDown size={13} aria-hidden="true" style={{ transform: showDatePicker ? 'rotate(180deg)' : undefined, transition: 'transform 200ms' }} />
              </button>
              {showDatePicker && (
                <FloatingPanel onClose={() => setShowDatePicker(false)} width={220} left={0}>
                  <div role="listbox" aria-label="Select date range" style={{ position: 'relative', zIndex: 1001 }}>
                    {(Object.keys(DATE_RANGE_LABELS) as DateRange[]).map(r => (
                      <button key={r}
                        role="option"
                        aria-selected={filters.dateRange === r}
                        onClick={() => { patchFilter({ dateRange: r }); setShowDatePicker(false); }}
                        style={{
                          display: 'block', width: '100%', textAlign: 'left',
                          padding: '12px 14px', border: 'none', cursor: 'pointer',
                          borderRadius: 'var(--r-xs)', fontSize: '14px',
                          background: filters.dateRange === r ? 'var(--accent-light)' : 'none',
                          color: filters.dateRange === r ? 'var(--accent-dark)' : 'var(--text-primary)',
                          fontWeight: filters.dateRange === r ? 600 : 400,
                          transition: 'background 120ms',
                          minHeight: 40,
                        }}
                        onMouseEnter={e => { if (filters.dateRange !== r) e.currentTarget.style.background = 'var(--bg-base)'; }}
                        onMouseLeave={e => { if (filters.dateRange !== r) e.currentTarget.style.background = 'none'; }}
                      >
                        {DATE_RANGE_LABELS[r]}
                      </button>
                    ))}
                  </div>
                  {filters.dateRange === 'custom' && (
                    <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--border)' }}>
                      <label htmlFor="custom-from" style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>FROM</label>
                      <input id="custom-from" type="date" className="input-pharm" value={filters.customFrom}
                        onChange={e => patchFilter({ customFrom: e.target.value })} style={{ fontSize: '13px' }} />
                      <label htmlFor="custom-to" style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>TO</label>
                      <input id="custom-to" type="date" className="input-pharm" value={filters.customTo}
                        onChange={e => patchFilter({ customTo: e.target.value })} style={{ fontSize: '13px' }} />
                    </div>
                  )}
                </FloatingPanel>
              )}
            </div>

            {/* Filters toggle */}
            <button
              className={showFilters || activeFilterCount > 0 ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setShowFilters(v => !v)}
              style={{ gap: '8px', minHeight: 44 }}
              aria-expanded={showFilters}
              aria-controls="filter-panel"
            >
              <Filter size={14} aria-hidden="true" />
              Filters
              {activeFilterCount > 0 && (
                <span style={{
                  background: 'rgba(255,255,255,0.25)', borderRadius: 999,
                  fontSize: '11px', fontWeight: 700, padding: '1px 7px', minWidth: '20px', textAlign: 'center',
                }}>
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Refresh */}
            <button className="btn-ghost" onClick={() => loadData(true)}
              style={{ padding: '8px', borderRadius: 999, width: 44, height: 44 }} 
              aria-label="Refresh report data"
              title="Refresh data"
            >
              <RefreshCw size={15} aria-hidden="true" style={{ animation: isRefreshing ? 'spin 1s linear infinite' : undefined }} />
            </button>

            {/* Export */}
            <button className="btn-secondary" onClick={() => alert('CSV export coming soon.')} style={{ minHeight: 44 }}>
              <Download size={14} aria-hidden="true" />
              Export
            </button>
            </div>
          }
        />

        {/* ══ FILTER PANEL ══ */}
        {showFilters && (
          <div id="filter-panel" className="card-pharm" style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontWeight: 700, fontSize: '14px', margin: 0 }}>Filter Configuration</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                {activeFilterCount > 0 && (
                  <button className="btn-ghost" style={{ fontSize: '13px', color: 'var(--status-critical)', minWidth: 44, minHeight: 44 }}
                    onClick={() => setFilters(defaultFilters)}>
                    <X size={13} aria-hidden="true" /> Reset all
                  </button>
                )}
                <button 
                  className="btn-ghost" 
                  style={{ padding: '6px', width: 44, height: 44 }} 
                  onClick={() => setShowFilters(false)}
                  aria-label="Close filter panel"
                >
                  <X size={16} aria-hidden="true" />
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              {/* Search */}
              <FilterGroup label="Product Search">
                <div style={{ position: 'relative' }}>
                  <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input className="input-pharm" placeholder="Search products…"
                    value={filters.search} onChange={e => patchFilter({ search: e.target.value })}
                    style={{ paddingLeft: '32px' }} />
                </div>
              </FilterGroup>

              {/* Category */}
              <FilterGroup label="Product Category">
                <select className="input-pharm" value={filters.category}
                  onChange={e => patchFilter({ category: e.target.value })}>
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>
                  ))}
                </select>
              </FilterGroup>

              {/* Group by */}
              <FilterGroup label="Group Chart By">
                <div style={{ display: 'flex', gap: '4px' }}>
                  {(['day', 'week', 'month'] as GroupBy[]).map(g => (
                    <button key={g} onClick={() => patchFilter({ groupBy: g })}
                      style={{
                        flex: 1, padding: '6px 0', borderRadius: 999, border: 'none',
                        background: filters.groupBy === g ? 'var(--accent)' : 'var(--bg-base)',
                        color: filters.groupBy === g ? '#fff' : 'var(--text-secondary)',
                        fontWeight: 600, fontSize: '12px', cursor: 'pointer',
                        transition: 'all 160ms',
                      }}>
                      {g.charAt(0).toUpperCase() + g.slice(1)}
                    </button>
                  ))}
                </div>
              </FilterGroup>

              {/* Sort */}
              <FilterGroup label="Sort Products By">
                <div style={{ display: 'flex', gap: '6px' }}>
                  <select className="input-pharm" value={filters.sortBy}
                    onChange={e => patchFilter({ sortBy: e.target.value as SortField })}
                    style={{ flex: 1 }}>
                    <option value="revenue">Revenue</option>
                    <option value="quantity">Units Sold</option>
                    <option value="name">Name</option>
                  </select>
                  <button onClick={() => patchFilter({ sortDir: filters.sortDir === 'asc' ? 'desc' : 'asc' })}
                    style={{
                      width: '38px', border: '1px solid var(--border-strong)', borderRadius: 'var(--r-sm)',
                      background: 'var(--bg-card)', cursor: 'pointer', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', transition: 'all 140ms',
                    }}
                    title={`Sort ${filters.sortDir === 'asc' ? 'descending' : 'ascending'}`}>
                    {filters.sortDir === 'asc'
                      ? <ArrowUpRight size={14} style={{ color: 'var(--accent)' }} />
                      : <ArrowDownRight size={14} style={{ color: 'var(--text-muted)' }} />}
                  </button>
                </div>
              </FilterGroup>

              {/* Min revenue */}
              <FilterGroup label="Min Revenue (TZS)">
                <input className="input-pharm" type="number" placeholder="e.g. 50000"
                  value={filters.minRevenue} onChange={e => patchFilter({ minRevenue: e.target.value })} />
              </FilterGroup>

              {/* Toggles */}
              <FilterGroup label="Quick Flags">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <ToggleRow
                    label="Low stock items only"
                    checked={filters.showLowStock}
                    onChange={v => patchFilter({ showLowStock: v })}
                  />
                  <ToggleRow
                    label="Expired / expiring items"
                    checked={filters.showExpired}
                    onChange={v => patchFilter({ showExpired: v })}
                  />
                </div>
              </FilterGroup>
            </div>
          </div>
        )}

        {/* ══ TABS ══ */}
        <div 
          role="tablist"
          aria-label="Report modules"
          style={{ display: 'flex', gap: '4px', borderBottom: '1px solid var(--border)', paddingBottom: '0', overflowX: 'auto' }}
        >
          {([
            { id: 'overview',    label: 'Overview',     icon: BarChart3  },
            { id: 'sales',       label: 'Sales',        icon: ShoppingCart },
            { id: 'inventory',   label: 'Inventory',    icon: Layers     },
            { id: 'procurement', label: 'Procurement',  icon: Truck      },
          ] as { id: ReportTab; label: string; icon: any }[]).map(({ id, label, icon: Icon }) => (
            <button 
              key={id} 
              id={`tab-${id}`}
              role="tab"
              aria-selected={tab === id}
              aria-controls={`panel-${id}`}
              onClick={() => setTab(id)} 
              style={{
                display: 'flex', alignItems: 'center', gap: '7px',
                padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer',
                fontWeight: tab === id ? 600 : 500, fontSize: '14px',
                color: tab === id ? 'var(--accent)' : 'var(--text-secondary)',
                borderBottom: `2px solid ${tab === id ? 'var(--accent)' : 'transparent'}`,
                marginBottom: '-1px', transition: 'all 150ms',
                minHeight: 44, whiteSpace: 'nowrap',
              }}
            >
              <Icon size={15} strokeWidth={tab === id ? 2.5 : 1.5} aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>

        {/* ══ OVERVIEW TAB ══ */}
        {tab === 'overview' && (
          <>
            {/* Metric cards */}
            {isLoading ? (
              <div className="grid-dashboard-4">
                <MetricCardSkeleton /><MetricCardSkeleton /><MetricCardSkeleton /><MetricCardSkeleton />
              </div>
            /* ── Four KPI cards ── */
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div className="grid-dashboard-4">

                <DashboardCard
                  variant="operational"
                  label="Total Revenue"
                  value={trends.revenue}
                  sub={formatCurrency(trends.revenue, currency)}
                  change="+14.2%"
                  changeUp
                  icon={<TrendingUp size={18} strokeWidth={1.5} />}
                  iconBg="var(--accent-light)"
                  iconColor="var(--accent)"
                  delay={0}
                />
                <DashboardCard
                  variant="operational"
                  label="Transactions"
                  value={trends.txns}
                  sub="completed sales"
                  icon={<Receipt size={20} strokeWidth={1.5} />}
                  iconBg="var(--status-success-bg)"
                  iconColor="var(--status-success)"
                  delay={80}
                />
                <DashboardCard
                  variant="informational"
                  label="Avg. Order Value"
                  value={trends.txns > 0 ? formatCurrency(trends.revenue / trends.txns, currency) : '—'}
                  sub="per transaction"
                  icon={<Banknote size={20} strokeWidth={1.5} />}
                  iconBg="var(--status-info-bg)"
                  iconColor="var(--status-info)"
                  delay={160}
                />
                <DashboardCard
                  variant="informational"
                  label="Efficiency"
                  value="98.4%"
                  change="+0.6%"
                  changeUp
                  sub="vs last period"
                  icon={<Zap size={20} strokeWidth={1.5} />}
                  iconBg="var(--status-warning-bg)"
                  iconColor="var(--status-warning)"
                  delay={240}
                />
              </div>

              {/* Quick AI Insights Banner */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.08) 0%, rgba(59, 130, 246, 0.08) 100%)',
                border: '1px solid rgba(79, 70, 229, 0.15)',
                borderRadius: 'var(--r-md)', padding: '16px 20px',
                display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap'
              }}>
                <div style={{ background: '#4f46e5', color: '#fff', padding: '10px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)' }}>
                  <Zap size={20} strokeWidth={2} />
                </div>
                <div style={{ flex: 1, minWidth: 'min(100%, 300px)' }}>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>System Insights</h4>
                  <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Revenue trends are up <strong>14.2%</strong> over the selected period. <strong>{topProducts[0]?.name || 'Top products'}</strong> account for high volume. Consider adjusting stock thresholds!
                  </p>
                </div>
              </div>
            </div>
            )}

            {/* Chart + Top Products */}
            <div className="grid-responsive-2-1" style={{ display: 'grid', gap: '24px' }}>
              {isLoading ? <ChartSkeleton /> : (
                <div className="card-pharm" style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div>
                      <h3 className="heading-section">Revenue Overview</h3>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px' }}>
                        Grouped by {filters.groupBy} · {DATE_RANGE_LABELS[filters.dateRange]}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {(['day', 'week', 'month'] as GroupBy[]).map(g => (
                        <button key={g} onClick={() => patchFilter({ groupBy: g })} style={{
                          padding: '4px 10px', borderRadius: 999, border: 'none', fontSize: '12px',
                          background: filters.groupBy === g ? 'var(--accent)' : 'var(--bg-base)',
                          color: filters.groupBy === g ? '#fff' : 'var(--text-secondary)',
                          fontWeight: 600, cursor: 'pointer', transition: 'all 160ms',
                        }}>
                          {g.charAt(0).toUpperCase() + g.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Peak value label */}
                  <div style={{ marginBottom: '12px', paddingLeft: '4px' }}>
                    <span style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em' }}>
                      {formatCurrency(trends.revenue, currency)}
                    </span>
                    <span style={{ fontSize: '13px', color: 'var(--status-success)', fontWeight: 600, marginLeft: '8px' }}>
                      ↑ 14.2%
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '180px' }}>
                    {chartData.map((bar, i) => {
                      const isMax = bar.value === Math.max(...chartData.map(b => b.value));
                      return (
                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', height: '100%', justifyContent: 'flex-end' }}>
                          <ChartBar height={bar.value} active={isMax} label={bar.label} index={i} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Top products panel */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <h3 className="heading-section">Top Products</h3>
                  <select style={{
                    border: '1px solid var(--border-strong)', borderRadius: 999, padding: '4px 10px',
                    fontSize: '12px', background: 'var(--bg-card)', color: 'var(--text-secondary)',
                    cursor: 'pointer', fontWeight: 600,
                  }} value={filters.sortBy} onChange={e => patchFilter({ sortBy: e.target.value as SortField })}>
                    <option value="revenue">By revenue</option>
                    <option value="quantity">By units</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {isLoading
                    ? [1,2,3,4,5].map(i => (
                      <div key={i} className="card-pharm" style={{ padding: '14px 16px' }}>
                        <div className="skeleton" style={{ width: '60%', height: 14, marginBottom: 10 }} />
                        <div className="skeleton" style={{ width: '100%', height: 4, borderRadius: 2 }} />
                      </div>
                    ))
                    : filteredProducts.length === 0
                      ? <EmptyState icon={<Package size={20} strokeWidth={1.5} />} title="No products match filters" desc="Adjust your filter criteria above." />
                      : filteredProducts.slice(0, 7).map((p, i) => (
                        <TopProductRow key={p.id ?? i} rank={i + 1} name={p.name} qty={p.qty} revenue={p.revenue} pct={p.pct} />
                      ))
                  }
                </div>
              </div>
            </div>

            {/* ── Second row: summary stats (informational, staggered) ── */}
            <div className="grid-dashboard-3">
              {[
                {
                  label: 'Sales this month',  value: trends.txns,
                  sub: 'transactions',
                  icon: <ShoppingCart size={16} />,
                  iconBg: 'rgba(0,103,192,0.1)', iconColor: 'var(--accent)',
                  delay: 0,
                },
                {
                  label: 'Product catalogue', value: topProducts.length,
                  sub: 'products',
                  icon: <Package size={16} />,
                  iconBg: 'rgba(15,123,15,0.1)', iconColor: 'var(--status-success)',
                  delay: 120,
                },
                {
                  label: 'Inventory items',   value: inventoryItems.length,
                  sub: 'SKUs tracked',
                  icon: <Layers size={16} />,
                  iconBg: 'rgba(157,93,0,0.1)', iconColor: 'var(--status-warning)',
                  delay: 240,
                },
              ].map(({ label, value, sub, icon, iconBg, iconColor, delay }) => (
                <DashboardCard
                  key={label}
                  variant="informational"
                  label={label}
                  value={value}
                  sub={sub}
                  icon={icon}
                  iconBg={iconBg}
                  iconColor={iconColor}
                  delay={delay}
                />
              ))}
            </div>
          </>
        )}

        {/* ══ SALES TAB ══ */}
        {tab === 'sales' && (
          <div className="card-pharm" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 className="heading-section">Sales Breakdown</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px' }}>
                  {filteredProducts.length} products · {DATE_RANGE_LABELS[filters.dateRange]}
                  {filters.category !== 'all' && ` · ${filters.category}`}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input className="input-pharm" placeholder="Search…" value={filters.search}
                    onChange={e => patchFilter({ search: e.target.value })}
                    style={{ paddingLeft: '30px', height: '34px', width: '180px', fontSize: '13px' }} />
                </div>
                <select className="input-pharm" value={filters.category} onChange={e => patchFilter({ category: e.target.value })}
                  style={{ height: '34px', fontSize: '13px', width: '160px' }}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>)}
                </select>
              </div>
            </div>

            {isLoading ? (
              <div style={{ padding: '24px' }}><ChartSkeleton /></div>
            ) : (
              <div className="table-scroll">
                <table className="table-pharm">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>
                        <SortHeader label="Product" field="name" current={filters.sortBy} dir={filters.sortDir} onSort={(f, d) => patchFilter({ sortBy: f, sortDir: d })} />
                      </th>
                      <th>Category</th>
                      <th style={{ textAlign: 'right' }}>
                        <SortHeader label="Units Sold" field="quantity" current={filters.sortBy} dir={filters.sortDir} onSort={(f, d) => patchFilter({ sortBy: f, sortDir: d })} />
                      </th>
                      <th style={{ textAlign: 'right' }}>
                        <SortHeader label="Revenue" field="revenue" current={filters.sortBy} dir={filters.sortDir} onSort={(f, d) => patchFilter({ sortBy: f, sortDir: d })} />
                      </th>
                      <th style={{ textAlign: 'right' }}>Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.length === 0 ? (
                      <tr><td colSpan={6} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>No results match your filters</td></tr>
                    ) : filteredProducts.map((p, i) => {
                      const totalRev = filteredProducts.reduce((s, x) => s + x.revenue, 0);
                      const share = totalRev > 0 ? Math.round((p.revenue / totalRev) * 100) : 0;
                      return (
                        <tr key={p.id ?? i}>
                          <td>
                            <span aria-label={`Rank ${i+1}`} style={{ width: 24, height: 24, borderRadius: '50%', background: i === 0 ? 'var(--accent)' : 'var(--bg-base)', color: i === 0 ? '#fff' : 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700 }}>
                              {i + 1}
                            </span>
                          </td>
                          <td style={{ fontWeight: 500 }}>{p.name}</td>
                          <td><span className="badge badge-blue" style={{ fontSize: '11px' }}>{p.category}</span></td>
                          <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{p.qty}</td>
                          <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: 'var(--text-primary)' }}>{formatCurrency(p.revenue, currency)}</td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
                              <div style={{ width: 60, height: 4, background: 'var(--bg-base)', borderRadius: 2, overflow: 'hidden' }} aria-hidden="true">
                                <div style={{ width: `${share}%`, height: '100%', background: 'var(--accent)', borderRadius: 2 }} />
                              </div>
                              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, minWidth: '28px', textAlign: 'right' }} aria-label={`${share} percent share`}>{share}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ══ INVENTORY TAB ══ */}
        {tab === 'inventory' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Inventory flag filters */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { label: 'All items',       value: false, key: 'showLowStock' as const },
                { label: 'Low stock',       value: true,  key: 'showLowStock' as const },
                { label: 'Expiring soon',   value: true,  key: 'showExpired'  as const },
              ].map(({ label, value, key }) => (
                <button key={label}
                  onClick={() => patchFilter(key === 'showLowStock'
                    ? { showLowStock: value, showExpired: false }
                    : { showExpired: value, showLowStock: false })}
                  className={
                    (key === 'showLowStock' && filters.showLowStock === value && !filters.showExpired) ||
                    (key === 'showExpired' && filters.showExpired === value && !filters.showLowStock) ||
                    (label === 'All items' && !filters.showLowStock && !filters.showExpired)
                      ? 'btn-primary' : 'btn-secondary'
                  }
                  style={{ fontSize: '13px' }}>
                  {label}
                </button>
              ))}
            </div>

            <div className="card-pharm" style={{ padding: '0', overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
                <h3 className="heading-section">Inventory Status</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px' }}>
                  {inventoryItems.length} total SKUs tracked
                </p>
              </div>
              {isLoading ? (
                <div style={{ padding: '24px' }}><ChartSkeleton /></div>
              ) : inventoryItems.length === 0 ? (
                <EmptyState icon={<Layers size={20} />} title="No inventory data" desc="Stock will appear here after procurement entries." />
              ) : (
                <div className="table-scroll">
                  <table className="table-pharm">
                    <thead><tr>
                      <th>Product</th>
                      <th style={{ textAlign: 'right' }}>Stock</th>
                      <th style={{ textAlign: 'right' }}>Reorder Level</th>
                      <th>Expiry</th>
                      <th>Status</th>
                    </tr></thead>
                    <tbody>
                      {inventoryItems
                        .filter(item => {
                          const qty = item.stock_qty ?? 0;
                          if (filters.showLowStock) return qty < 10;
                          return true;
                        })
                        .map((item, i) => {
                          const qty = item.stock_qty ?? 0;
                          const isLow = qty < 10;
                          const product = products.find(p => p.id === item.product_id);
                          const name = product?.name ?? 'Unknown Product';
                          const expiry = item.expiry_date ? new Date(item.expiry_date) : null;
                          const daysLeft = expiry ? Math.ceil((expiry.getTime() - Date.now()) / 86400000) : null;
                          const isSoonExpiry = daysLeft !== null && daysLeft <= 30 && daysLeft > 0;
                          const isExpired   = daysLeft !== null && daysLeft <= 0;
                          return (
                            <tr key={item.id ?? i}>
                              <td style={{ fontWeight: 500 }}>{name}</td>
                              <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 700, color: isLow ? 'var(--status-critical)' : 'var(--text-primary)' }}>{qty}</td>
                              <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>10</td>
                              <td style={{ color: isExpired ? 'var(--status-critical)' : isSoonExpiry ? 'var(--status-warning)' : 'var(--text-secondary)', fontSize: '13px' }}>
                                {expiry ? expiry.toLocaleDateString('en-GB') : '—'}
                              </td>
                              <td>
                                {isExpired   && <span className="badge badge-red">Expired</span>}
                                {isSoonExpiry && !isExpired && <span className="badge badge-amber">Expiring soon</span>}
                                {isLow && !isExpired && !isSoonExpiry && <span className="badge badge-red">Low stock</span>}
                                {!isLow && !isSoonExpiry && !isExpired && <span className="badge badge-green">OK</span>}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ PROCUREMENT TAB ══ */}
        {tab === 'procurement' && (
          <div className="card-pharm" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 className="heading-section">Procurement Orders</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px' }}>
                  Historical purchase orders · {DATE_RANGE_LABELS[filters.dateRange]}
                </p>
              </div>
              <button className="btn-secondary" onClick={() => alert('Procurement export coming soon.')} style={{ fontSize: '13px' }}>
                <Download size={13} /> Export
              </button>
            </div>
            <div style={{ padding: '48px', textAlign: 'center' }}>
              <Truck size={36} strokeWidth={1} style={{ color: 'var(--text-muted)', opacity: 0.4, marginBottom: '12px' }} />
              <p style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-primary)', margin: '0 0 6px' }}>Procurement analytics</p>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                Detailed procurement cost analysis and supplier reports will appear here once orders are committed.
              </p>
            </div>
          </div>
        )}

      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   SUB-COMPONENTS
══════════════════════════════════════════════════════════════════════ */


function ChartBar({ height, active, label, index }: { height: number; active: boolean; label: string; index: number }) {
  const [h, setH] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    // Stagger each bar grow-up
    const t = setTimeout(() => setReady(true), 120 + index * 60);
    return () => clearTimeout(t);
  }, [index]);
  return (
    <>
      {h && (
        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent)', background: 'var(--accent-light)', padding: '2px 6px', borderRadius: 4 }}>
          {height}%
        </span>
      )}
      <div
        onMouseEnter={() => setH(true)}
        onMouseLeave={() => setH(false)}
        style={{
          width: '100%', maxWidth: '48px',
          height: `${height}%`,
          background: active ? 'var(--accent)' : h ? 'var(--accent-mid)' : '#E2E8F0',
          borderRadius: '6px 6px 2px 2px',
          transition: 'background 140ms ease, box-shadow 140ms ease',
          cursor: 'pointer',
          boxShadow: active ? 'var(--shadow-btn-primary)' : 'none',
          transformOrigin: 'bottom',
          transform: ready ? 'scaleY(1)' : 'scaleY(0)',
          // Use transition for grow-up effect
          transitionProperty: ready ? 'background, box-shadow, transform' : 'none',
          transitionDuration: ready ? `${300 + index * 40}ms` : '0ms',
          transitionTimingFunction: 'cubic-bezier(0.34,1.56,0.64,1)',
        }}
        title={`${label}: ${height}%`}
      />
      <span style={{ fontSize: '11px', color: h || active ? 'var(--accent)' : 'var(--text-muted)', fontWeight: active ? 700 : 400 }}>
        {label}
      </span>
    </>
  );
}

function TopProductRow({ rank, name, qty, revenue, pct }: {
  rank: number; name: string; qty: number; revenue: number; pct: number;
}) {
  const [h, setH] = useState(false);
  return (
    <div className="card-pharm" onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'default' }}>
      <span style={{
        width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
        background: rank === 1 ? 'var(--accent)' : h ? 'var(--accent-light)' : 'var(--bg-base)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '12px', fontWeight: 700,
        color: rank === 1 ? '#fff' : h ? 'var(--accent)' : 'var(--text-muted)',
        transition: 'all 150ms',
      }}>
        {rank}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 500, fontSize: '14px', color: 'var(--text-primary)', margin: '0 0 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {name}
        </p>
        <div style={{ height: 4, width: '100%', background: '#E2E8F0', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: rank === 1 ? 'var(--accent)' : 'var(--accent-mid)', borderRadius: 2, transition: 'width 600ms cubic-bezier(0.16,1,0.3,1)' }} />
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums', display: 'block' }}>{qty} <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--text-muted)' }}>units</span></span>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(revenue)}</span>
      </div>
    </div>
  );
}

function SortHeader({ label, field, current, dir, onSort }: {
  label: string; field: SortField; current: SortField; dir: 'asc' | 'desc';
  onSort: (f: SortField, d: 'asc' | 'desc') => void;
}) {
  const active = current === field;
  return (
    <button onClick={() => onSort(field, active && dir === 'desc' ? 'asc' : 'desc')}
      style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600, fontSize: '12px', color: active ? 'var(--accent)' : 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
      {label}
      {active && (dir === 'asc' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />)}
    </button>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
      {children}
    </div>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
      <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
      <button role="switch" aria-checked={checked} onClick={() => onChange(!checked)} style={{
        width: 38, height: 20, borderRadius: 999,
        background: checked ? 'var(--accent)' : 'var(--border-strong)', border: 'none', cursor: 'pointer',
        position: 'relative', transition: 'background 200ms',
      }}>
        <span style={{ position: 'absolute', top: 2, left: checked ? 19 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.15)', transition: 'left 200ms cubic-bezier(0.2,0,0,1)' }} />
      </button>
    </div>
  );
}

function FloatingPanel({ children, onClose, width = 240, right, left }: {
  children: React.ReactNode; onClose: () => void; width?: number; right?: number; left?: number;
}) {
  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 999 }} onClick={onClose} />
      <div style={{
        position: 'absolute', top: 'calc(100% + 8px)',
        right: right !== undefined ? right : undefined,
        left: left !== undefined ? left : right !== undefined ? undefined : 0,
        width, background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(16px)',
        border: '1px solid var(--border-strong)',
        borderRadius: 'var(--r-md)',
        boxShadow: 'var(--shadow-md)',
        zIndex: 1000, padding: '6px',
        animation: 'fadeSlideIn 150ms cubic-bezier(0.2,0,0,1) forwards',
      }}>
        {children}
      </div>
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}

function EmptyState({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="card-pharm empty-state" style={{ padding: '48px 24px' }}>
      <div className="empty-state-icon">{icon}</div>
      <p className="empty-state-title">{title}</p>
      <p className="empty-state-desc">{desc}</p>
    </div>
  );
}
