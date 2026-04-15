'use client';

import React, { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: ReactNode;
  icon?: ReactNode;
  iconBg?: string;
  iconColor?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, icon, iconBg = 'var(--accent-light)', iconColor = 'var(--accent)', actions }: PageHeaderProps) {
  return (
    <div 
      className="page-header-root"
      style={{
        display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap',
        marginBottom: '32px',
      }}
    >
      <style>{`
        @keyframes headerIconEntrance {
          0% { opacity: 0; transform: scale(0.6) translateY(4px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes headerTitleEntrance {
          0% { opacity: 0; transform: translateX(-8px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        @keyframes headerSubtitleEntrance {
          0% { opacity: 0; transform: translateY(4px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 640px) {
          .page-header-root { flex-direction: column !important; align-items: stretch !important; gap: 20px !important; }
          :root { --header-title-size: 22px; }
          .page-header-main { gap: 12px !important; }
          .page-header-icon { width: 40px !important; height: 40px !important; border-radius: 12px !important; }
          .page-header-icon svg { width: 20px !important; height: 20px !important; }
          .page-header-actions { justify-content: flex-start !important; width: 100% !important; flex-wrap: wrap !important; }
        }
      `}</style>
      
      <div className="page-header-main" style={{ display: 'flex', alignItems: 'flex-start', gap: '18px' }}>
        {icon && (
          <div 
            className="page-header-icon"
            aria-hidden="true"
            style={{
              width: 48, height: 48, borderRadius: '14px',
              background: iconBg,
              backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: iconColor,
              flexShrink: 0,
              boxShadow: `0 8px 24px -6px ${iconColor.replace('var(--', 'var(--shadow-').replace(')', ', 0.35)')}, inset 0 1px 1px rgba(255,255,255,0.8)`,
              animation: 'headerIconEntrance 0.6s cubic-bezier(0.16, 1, 0.3, 1) both',
            }}
          >
            {React.cloneElement(icon as React.ReactElement, { size: 24, strokeWidth: 1.5 } as any)}
          </div>
        )}
        
        <div style={{ paddingTop: icon ? '2px' : '0', flex: 1, minWidth: 0 }}>
          <h1 className="heading-page" style={{ 
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: 'var(--text-primary)',
            animation: 'headerTitleEntrance 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both',
            margin: 0,
            fontSize: 'var(--header-title-size, 28px)'
          }}>
            {title}
          </h1>
          {subtitle && (
            <div className="text-subtitle" style={{ 
              marginTop: '6px', 
              fontWeight: 400,
              opacity: 0.75,
              fontSize: '14px',
              color: 'var(--text-secondary)',
              animation: 'headerSubtitleEntrance 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both',
              lineHeight: 1.5,
              overflow: 'hidden', textOverflow: 'ellipsis'
            }}>
              {subtitle}
            </div>
          )}
        </div>
      </div>
      
      {actions && (
        <div 
          className="page-header-actions"
          style={{ 
            display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '4px', 
            animation: 'headerIconEntrance 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.15s both',
            flexWrap: 'wrap'
          }}
        >
          {actions}
        </div>
      )}
    </div>

  );
}
