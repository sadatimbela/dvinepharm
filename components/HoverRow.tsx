'use client';

import { ReactNode, useState } from 'react';

/** A plain <tr> that highlights on hover */
export function HoverRow({ children, border }: { children: ReactNode; border?: boolean }) {
  const [hovered, setHovered] = useState(false);
  return (
    <tr
      style={{
        background: hovered ? '#F9FAFB' : '',
        borderBottom: border ? '1px solid var(--border)' : 'none',
        transition: 'background 120ms',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
    </tr>
  );
}
