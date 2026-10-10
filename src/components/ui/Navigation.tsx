'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  ClipboardCheck,
  ShieldCheck,
  History,
  RotateCcw,
  Zap,
  FastForward,
  Layers,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';

interface NavigationProps {
  onReset?: () => void;
  onAdvance?: () => void;
  onTriggerInterruption?: () => void;
  isSimulating?: boolean;
}

export function Navigation({
  onReset,
  onAdvance,
  onTriggerInterruption,
  isSimulating = false,
}: NavigationProps) {
  const pathname = usePathname();
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
    { href: '/', label: 'Command Center', icon: Activity },
    { href: '/field', label: 'Field Worker Mode', icon: ClipboardCheck },
    { href: '/supervisor', label: 'Supervisor Review', icon: ShieldCheck },
    { href: '/audit', label: 'Audit Trail', icon: History },
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-950/95 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* SafeRestart Brand */}
        <div className="flex items-center space-x-6">
          <Link href="/" className="flex items-center space-x-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 group-hover:border-cyan-400 transition-colors">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-base tracking-tight text-slate-100 font-mono">
                  SafeRestart
                </span>
                <span className="text-[10px] uppercase font-mono px-1 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                  v1.0
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono leading-none">
                Intermittent Water Restart Support
              </p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium font-mono transition-colors ${
                    isActive
                      ? 'bg-slate-800 text-cyan-400 border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Action Controls & Simulation Buttons */}
        <div className="flex items-center space-x-2.5">
          {/* Environment Indicator */}
          <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-300 font-mono">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Local Adapter • AWS Bedrock Ready</span>
          </div>

          {/* Simulation Controls */}
          {onTriggerInterruption && (
            <button
              onClick={() => handleAction('interrupt', onTriggerInterruption)}
              disabled={actionLoading !== null || isSimulating}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800 text-xs font-mono transition-colors disabled:opacity-50"
              title="Simulate network pressure drop and supply cut"
            >
              <Zap className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Simulate Cut</span>
            </button>
          )}

          {onAdvance && (
            <button
              onClick={() => handleAction('advance', onAdvance)}
              disabled={actionLoading !== null || isSimulating}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono transition-colors disabled:opacity-50"
              title="Advance simulation clock by 1 hour"
            >
              <FastForward className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">+1 Hour</span>
            </button>
          )}

          {onReset && (
            <button
              onClick={() => handleAction('reset', onReset)}
              disabled={actionLoading !== null || isSimulating}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 text-xs font-mono transition-colors disabled:opacity-50"
              title="Reset to deterministic initial state"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* 3-Minute Demo Quick Links Bar for Judges */}
      <div className="border-t border-slate-900 bg-slate-950/80 px-4 py-1.5 hidden sm:flex items-center justify-between text-[11px] font-mono text-slate-400">
        <div className="flex items-center space-x-2">
          <span className="text-cyan-400 font-bold">3-Min Judge Demo:</span>
          <span className="text-slate-500">1.</span>
          <button
            onClick={() => onTriggerInterruption?.()}
            className="text-rose-400 hover:text-rose-300 hover:underline"
          >
            Simulate Cut
          </button>
          <ChevronRight className="w-3 h-3 text-slate-600" />
          <span className="text-slate-500">2.</span>
          <Link href="/#holds" className="text-amber-400 hover:text-amber-300 hover:underline">
            Risk HOLD
          </Link>
          <ChevronRight className="w-3 h-3 text-slate-600" />
          <span className="text-slate-500">3.</span>
          <Link href="/field" className="text-cyan-300 hover:text-cyan-200 hover:underline">
            Field Checklist
          </Link>
          <ChevronRight className="w-3 h-3 text-slate-600" />
          <span className="text-slate-500">4.</span>
          <Link href="/supervisor" className="text-purple-300 hover:text-purple-200 hover:underline">
            Supervisor Gate
          </Link>
          <ChevronRight className="w-3 h-3 text-slate-600" />
          <span className="text-slate-500">5.</span>
          <Link href="/audit" className="text-emerald-300 hover:text-emerald-200 hover:underline">
            Audit Trail
          </Link>
        </div>

        <div className="text-[10px] text-slate-500">
          Field Safety • Low-Literacy UI • Deterministic Policy Gate
        </div>
      </div>

      {/* Mobile Navigation bar */}
      <div className="md:hidden border-t border-slate-800 px-2 py-1.5 flex justify-around bg-slate-950">
        {navLinks.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center p-1 text-[10px] font-mono ${
                isActive ? 'text-cyan-400 font-semibold' : 'text-slate-400'
              }`}
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span>{item.label.split(' ')[0]}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
}
