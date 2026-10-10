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
    default: 'border-slate-200 bg-white text-slate-900 shadow-sm',
    danger: 'border-rose-200 bg-rose-50/50 text-slate-900 shadow-sm',
    warning: 'border-amber-200 bg-amber-50/50 text-slate-900 shadow-sm',
    success: 'border-emerald-200 bg-emerald-50/50 text-slate-900 shadow-sm',
    info: 'border-sky-200 bg-sky-50/50 text-slate-900 shadow-sm',
  };

  const iconStyles = {
    default: 'text-slate-600 bg-slate-100',
    danger: 'text-rose-700 bg-rose-100',
    warning: 'text-amber-700 bg-amber-100',
    success: 'text-emerald-700 bg-emerald-100',
    info: 'text-sky-700 bg-sky-100',
  };

  return (
    <div
      onClick={onClick}
      className={`rounded-xl p-4 border transition-all duration-150 ${variantStyles[variant]} ${
        onClick ? 'cursor-pointer hover:shadow-md' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-slate-600 uppercase tracking-wider">
          {label}
        </span>
        <div className={`p-1.5 rounded-lg ${iconStyles[variant]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="flex items-baseline space-x-2">
        <span className="text-2xl font-bold tracking-tight text-slate-900">{value}</span>
        {badge && (
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
            {badge}
          </span>
        )}
      </div>

      {subtext && <p className="mt-1 text-xs text-slate-500 truncate">{subtext}</p>}
    </div>
  );
}
