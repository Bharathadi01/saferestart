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
    color: 'bg-slate-100 text-slate-800 border-slate-300',
    dot: 'bg-slate-500',
  };

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3.5 py-1.5 font-semibold',
  };

  return (
    <span
      role="status"
      aria-label={`Status: ${config.label}`}
      className={`inline-flex items-center gap-1.5 rounded-md font-sans font-medium border tracking-normal whitespace-nowrap transition-colors shadow-2xs ${config.color} ${sizeClasses[size]}`}
    >
      {showDot && (
        <span
          className={`w-2 h-2 rounded-full shrink-0 ${config.dot}`}
          aria-hidden="true"
        />
      )}
      <span>{config.label}</span>
    </span>
  );
}
