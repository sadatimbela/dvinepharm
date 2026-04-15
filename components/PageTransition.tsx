'use client';

import { ReactNode, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

/**
 * Wraps page content with a smooth fade-up entrance animation.
 * Re-triggers on every route change by resetting the animation.
 */
export default function PageTransition({ children, className }: PageTransitionProps) {
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Remove the class, force reflow, re-add to retrigger animation
    el.classList.remove('page-transition');
    void el.offsetHeight; // force reflow
    el.classList.add('page-transition');
  }, [pathname]);

  return (
    <div ref={ref} className={`page-transition${className ? ' ' + className : ''}`}>
      {children}
    </div>
  );
}
