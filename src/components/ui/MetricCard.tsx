import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: number | string;
  subtext?: string;
  icon: LucideIcon;
  variant?: 'default' | 'danger' | 'warning' | 'success' | 'info';
  badge?: string;
  onClick?: () => void;
}

export function MetricCard({
  label,
  value,
  subtext,
  icon: Icon,
  variant = 'default',
  badge,
  onClick,
}: MetricCardProps) {
  const variantStyles = {
    default: 'border-slate-800 bg-slate-900/80 text-slate-100',
    danger: 'border-rose-900/50 bg-rose-950/20 text-rose-100 hover:border-rose-600/50',
    warning: 'border-amber-900/50 bg-amber-950/20 text-amber-100 hover:border-amber-600/50',
    success: 'border-emerald-900/50 bg-emerald-950/20 text-emerald-100 hover:border-emerald-600/50',
    info: 'border-cyan-900/50 bg-cyan-950/20 text-cyan-100 hover:border-cyan-600/50',
  };

  const iconStyles = {
    default: 'text-slate-400 bg-slate-800/80',
    danger: 'text-rose-400 bg-rose-900/40',
    warning: 'text-amber-400 bg-amber-900/40',
    success: 'text-emerald-400 bg-emerald-900/40',
    info: 'text-cyan-400 bg-cyan-900/40',
  };

  return (
    <div
      onClick={onClick}
      className={`rounded-lg p-4 border transition-all duration-150 ${variantStyles[variant]} ${
        onClick ? 'cursor-pointer hover:translate-y-[-1px] shadow-sm' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">
          {label}
        </span>
        <div className={`p-1.5 rounded-md ${iconStyles[variant]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="flex items-baseline space-x-2">
        <span className="text-2xl font-bold font-mono tracking-tight">{value}</span>
        {badge && (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
            {badge}
          </span>
        )}
      </div>

      {subtext && <p className="mt-1 text-xs text-slate-400 truncate">{subtext}</p>}
    </div>
  );
}
