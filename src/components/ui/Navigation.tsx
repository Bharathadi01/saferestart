'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ClipboardCheck,
  ShieldCheck,
  History,
  Droplet,
  Zap,
  FastForward,
  RotateCcw,
  SlidersHorizontal,
  X,
  Languages,
  Sparkles,
} from 'lucide-react';
import { FieldReportCopilot } from '@/components/copilot/FieldReportCopilot';

interface NavigationProps {
  onReset?: () => void;
  onAdvance?: () => void;
  onTriggerInterruption?: () => void;
  isSimulating?: boolean;
  lang?: 'en' | 'ta';
  onToggleLang?: () => void;
}

export function Navigation({
  onReset,
  onAdvance,
  onTriggerInterruption,
  isSimulating = false,
  lang = 'en',
  onToggleLang,
}: NavigationProps) {
  const pathname = usePathname();
  const [showDemoTools, setShowDemoTools] = useState(false);
  const [showCopilot, setShowCopilot] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleAction = async (name: string, callback?: () => void) => {
    setActionLoading(name);
    try {
      if (callback) await callback();
    } finally {
      setActionLoading(null);
    }
  };

  const navLinks = [
    {
      href: '/',
      label: lang === 'ta' ? 'செயல்பாட்டுக் கண்ணோட்டம்' : 'Operations overview',
      desc: lang === 'ta' ? 'வலையமைப்பு நிலை' : 'Network Triage',
      icon: LayoutDashboard,
      isActive: pathname === '/',
    },
    {
      href: '/field',
      label: lang === 'ta' ? 'களப் பணி' : 'Field work',
      desc: lang === 'ta' ? 'பாதுகாப்பு சரிபார்ப்பு' : 'Safety Checklist',
      icon: ClipboardCheck,
      isActive: pathname === '/field',
    },
    {
      href: '/supervisor',
      label: lang === 'ta' ? 'மேற்பார்வையாளர் ஆய்வு' : 'Supervisor review',
      desc: lang === 'ta' ? 'ஒப்புதல் அறை' : 'Approval Gate',
      icon: ShieldCheck,
      isActive: pathname.startsWith('/supervisor'),
    },
    {
      href: '/audit',
      label: lang === 'ta' ? 'தணிக்கை வரலாறு' : 'Audit history',
      desc: lang === 'ta' ? 'நிகழ்வு வரலாறு' : 'Compliance Ledger',
      icon: History,
      isActive: pathname.startsWith('/audit'),
    },
  ];

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand & Identity */}
        <div className="flex items-center space-x-6">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-9 h-9 rounded-lg bg-sky-600 text-white flex items-center justify-center shadow-xs">
              <Droplet className="w-5 h-5 fill-white/20" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-base text-slate-900 tracking-tight">
                  SafeRestart
                </span>
                <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                  {lang === 'ta' ? 'மாதிரி பதிப்பு' : 'Demo Mode'}
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                {lang === 'ta'
                  ? 'குடிநீர் மறுதொடக்கம் முடிவு ஆதரவு'
                  : 'Drinking-Water Restart Safety Support'}
              </p>
            </div>
          </Link>

          {/* Primary Navigation Tabs */}
          <nav aria-label="Main Navigation" className="hidden md:flex items-center space-x-1 pl-2">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    item.isActive
                      ? 'bg-slate-100 text-slate-900 font-semibold border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4 text-slate-500" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Secondary Utility Controls */}
        <div className="flex items-center space-x-2.5">
          {/* Language Switcher */}
          {onToggleLang && (
            <button
              type="button"
              onClick={onToggleLang}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors"
              title="Toggle language (English / தமிழ்)"
              aria-label="Toggle language between English and Tamil"
            >
              <Languages className="w-3.5 h-3.5 text-slate-500" />
              <span>{lang === 'en' ? 'தமிழ்' : 'English'}</span>
            </button>
          )}

          {/* Demo Controls Drawer Toggle */}
          <button
            type="button"
            onClick={() => setShowDemoTools(!showDemoTools)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
              showDemoTools
                ? 'bg-slate-800 text-white border-slate-800'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
            title="Demonstration simulation controls"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Demo Tools</span>
          </button>
        </div>
      </div>

      {/* Discrete Simulation Controls Drawer for Judges / Demonstrators */}
      {showDemoTools && (
        <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 animate-in fade-in duration-150">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="text-slate-600">
              <strong className="text-slate-800 font-medium">Evaluation Sandbox Tools: </strong>
              Simulate events to test the deterministic risk engine and state machine.
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {onTriggerInterruption && (
                <button
                  type="button"
                  onClick={() => handleAction('interrupt', onTriggerInterruption)}
                  disabled={actionLoading !== null || isSimulating}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-medium transition-colors disabled:opacity-50"
                  title="Simulate sudden supply shutoff in Zone 5"
                >
                  <Zap className="w-3.5 h-3.5 text-rose-600" />
                  <span>Simulate Supply Cut</span>
                </button>
              )}

              {onAdvance && (
                <button
                  type="button"
                  onClick={() => handleAction('advance', onAdvance)}
                  disabled={actionLoading !== null || isSimulating}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-medium transition-colors disabled:opacity-50"
                  title="Advance simulation clock by 1 hour"
                >
                  <FastForward className="w-3.5 h-3.5 text-amber-600" />
                  <span>Advance 1 Hour</span>
                </button>
              )}

                {onReset && (
                <button
                  type="button"
                  onClick={() => handleAction('reset', onReset)}
                  disabled={actionLoading !== null || isSimulating}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-md bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 font-medium transition-colors disabled:opacity-50"
                  title="Reset simulation to initial state"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Reset Data</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowCopilot((prev) => !prev)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md border font-medium transition-colors ${
                  showCopilot
                    ? 'bg-purple-700 text-white border-purple-700 shadow-xs'
                    : 'bg-purple-50 hover:bg-purple-100 text-purple-800 border-purple-200'
                }`}
                title="Open AI Evidence Copilot Field Note Structurer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Note Copilot</span>
              </button>

              <button
                type="button"
                onClick={() => setShowDemoTools(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600"
                title="Close demo tools"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {showCopilot && (
            <div className="max-w-6xl mx-auto mt-4 pt-4 border-t border-slate-200 animate-in fade-in duration-150">
              <FieldReportCopilot />
            </div>
          )}
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden border-t border-slate-200 px-2 py-1.5 flex justify-around bg-white">
        {navLinks.map((item) => {
          const Icon = item.icon;
          const mobileLabel =
            item.href === '/'
              ? (lang === 'ta' ? 'கண்ணோட்டம்' : 'Overview')
              : item.href === '/field'
              ? (lang === 'ta' ? 'களப் பணி' : 'Field')
              : item.href === '/supervisor'
              ? (lang === 'ta' ? 'மேற்பார்வை' : 'Supervisor')
              : (lang === 'ta' ? 'தணிக்கை' : 'Audit');

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center py-1 px-2 rounded-md text-[11px] transition-colors ${
                item.isActive ? 'text-slate-900 font-bold bg-slate-100' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span>{mobileLabel}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
}
