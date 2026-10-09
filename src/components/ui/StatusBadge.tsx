import React from 'react';
import { ZoneOperationalState } from '@/types';
import { STATE_CONFIG } from '@/lib/constants';

interface StatusBadgeProps {
  state: ZoneOperationalState;
  showDot?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function StatusBadge({ state, showDot = true, size = 'md' }: StatusBadgeProps) {
  const config = STATE_CONFIG[state] || {
    label: state,
    color: 'bg-slate-700/40 text-slate-300 border-slate-600',
    dot: 'bg-slate-400',
  };

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3.5 py-1.5 font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center rounded-md font-mono font-medium border tracking-wide uppercase transition-colors ${config.color} ${sizeClasses[size]}`}
    >
      {showDot && (
        <span
          className={`w-1.5 h-1.5 rounded-full mr-1.5 shrink-0 ${config.dot}`}
        />
      )}
      {config.label}
    </span>
  );
}
