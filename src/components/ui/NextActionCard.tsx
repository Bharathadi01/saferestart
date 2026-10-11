'use client';

import React from 'react';
import Link from 'next/link';
import {
  AlertOctagon,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  User,
  Clock,
  HelpCircle,
  FileText,
} from 'lucide-react';

export interface NextActionCardProps {
  situation: string;
  safetyStatus: 'HOLD' | 'PROCEED' | 'CAUTION' | 'STABLE';
  safetyLabel?: string;
  evidenceNotes?: string[];
  nextAction: string;
  actionRationale?: string;
  responsibleRole: string;
  actionButton?: {
    label: string;
    href?: string;
    onClick?: () => void;
    variant?: 'primary' | 'teal' | 'danger' | 'secondary';
    disabled?: boolean;
  };
  secondaryButton?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  compact?: boolean;
}

export function NextActionCard({
  situation,
  safetyStatus,
  safetyLabel,
  evidenceNotes,
  nextAction,
  actionRationale,
  responsibleRole,
  actionButton,
  secondaryButton,
  compact = false,
}: NextActionCardProps) {
  const statusStyles = {
    HOLD: {
      border: 'border-rose-300',
      bg: 'bg-rose-50/70',
      badge: 'bg-rose-100 text-rose-900 border-rose-300',
      icon: AlertOctagon,
      iconColor: 'text-rose-700',
      titleColor: 'text-rose-950',
      defaultLabel: 'SAFETY HOLD ENFORCED',
    },
    CAUTION: {
      border: 'border-amber-300',
      bg: 'bg-amber-50/70',
      badge: 'bg-amber-100 text-amber-900 border-amber-300',
      icon: AlertTriangle,
      iconColor: 'text-amber-700',
      titleColor: 'text-amber-950',
      defaultLabel: 'VERIFICATION REQUIRED',
    },
    PROCEED: {
      border: 'border-teal-300',
      bg: 'bg-teal-50/70',
      badge: 'bg-teal-100 text-teal-900 border-teal-300',
      icon: CheckCircle2,
      iconColor: 'text-teal-700',
      titleColor: 'text-teal-950',
      defaultLabel: 'READY FOR SUPERVISOR SIGN-OFF',
    },
    STABLE: {
      border: 'border-slate-300',
      bg: 'bg-slate-50',
      badge: 'bg-slate-100 text-slate-800 border-slate-300',
      icon: ShieldCheck,
      iconColor: 'text-slate-600',
      titleColor: 'text-slate-900',
      defaultLabel: 'NOMINAL OPERATION',
    },
  };

  const style = statusStyles[safetyStatus];
  const StatusIcon = style.icon;

  const btnClasses = {
    primary:
      'bg-slate-900 hover:bg-slate-800 text-white font-medium shadow-xs focus:ring-slate-900',
    teal:
      'bg-teal-700 hover:bg-teal-800 text-white font-semibold shadow-xs focus:ring-teal-700',
    danger:
      'bg-rose-700 hover:bg-rose-800 text-white font-semibold shadow-xs focus:ring-rose-700',
    secondary:
      'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-medium shadow-2xs focus:ring-slate-400',
  };

  return (
    <section
      aria-label="Operational Next Action"
      className={`rounded-xl border ${style.border} ${style.bg} p-4 sm:p-5 shadow-2xs transition-all`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Situation & Action Description */}
        <div className="space-y-2 flex-1">
          {/* Header pill & Role attribution */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-bold tracking-wide uppercase border text-[11px] ${style.badge}`}
            >
              <StatusIcon className={`w-3.5 h-3.5 ${style.iconColor}`} aria-hidden="true" />
              <span>{safetyLabel || style.defaultLabel}</span>
            </span>

            <span className="inline-flex items-center gap-1 text-slate-600 font-medium">
              <User className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
              <span>Assigned: {responsibleRole}</span>
            </span>
          </div>

          {/* Current Situation (What is happening) */}
          <div className="text-xs sm:text-sm text-slate-700 leading-snug">
            <strong className="text-slate-900 font-semibold">Current State: </strong>
            {situation}
          </div>

          {/* Core Next Action (What to do next) */}
          <div className="pt-0.5">
            <div className="text-sm sm:text-base font-bold text-slate-900 flex items-start gap-1.5">
              <span className="text-slate-500 font-normal shrink-0">Next Action:</span>
              <span className={style.titleColor}>{nextAction}</span>
            </div>

            {actionRationale && (
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {actionRationale}
              </p>
            )}
          </div>

          {/* Evidence bullet points if provided */}
          {evidenceNotes && evidenceNotes.length > 0 && !compact && (
            <div className="pt-2 border-t border-slate-200/60 mt-2">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 block mb-1">
                Supporting Evidence & Verification Criteria:
              </span>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-700">
                {evidenceNotes.map((note, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-slate-400 mt-0.5">•</span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right: Explicit Action Buttons */}
        {(actionButton || secondaryButton) && (
          <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-200/60">
            {actionButton && (
              actionButton.href ? (
                <Link
                  href={actionButton.href}
                  className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    btnClasses[actionButton.variant || 'primary']
                  } ${actionButton.disabled ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <span>{actionButton.label}</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={actionButton.onClick}
                  disabled={actionButton.disabled}
                  className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    btnClasses[actionButton.variant || 'primary']
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <span>{actionButton.label}</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              )
            )}

            {secondaryButton && (
              secondaryButton.href ? (
                <Link
                  href={secondaryButton.href}
                  className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-white/80 transition-colors"
                >
                  <span>{secondaryButton.label}</span>
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={secondaryButton.onClick}
                  className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-white/80 transition-colors"
                >
                  <span>{secondaryButton.label}</span>
                </button>
              )
            )}
          </div>
        )}
      </div>
    </section>
  );
}
