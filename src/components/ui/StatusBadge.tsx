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
    color: 'bg-slate-800 text-slate-200 border-slate-700',
    dot: 'bg-slate-400',
  };

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3.5 py-1.5 font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md font-mono font-medium border tracking-wide uppercase whitespace-nowrap transition-colors shadow-sm ${config.color} ${sizeClasses[size]}`}
    >
      {showDot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dot}`}
        />
      )}
      <span>{config.label}</span>
    </span>
  );
}
