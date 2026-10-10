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
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-bold">
                  v1.0
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono leading-none mt-0.5">
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
                      ? 'bg-slate-850 text-cyan-300 border border-cyan-600/50 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
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
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-rose-950/70 hover:bg-rose-900 text-rose-200 border border-rose-800 text-xs font-mono font-semibold transition-colors disabled:opacity-50"
              title="Simulate network pressure drop and supply cut"
            >
              <Zap className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">Simulate Cut</span>
            </button>
          )}

          {onAdvance && (
            <button
              onClick={() => handleAction('advance', onAdvance)}
              disabled={actionLoading !== null || isSimulating}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-850 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-mono font-semibold transition-colors disabled:opacity-50"
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
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 text-xs font-mono transition-colors disabled:opacity-50"
              title="Reset to deterministic initial state"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* 3-Minute Demo Quick Links Bar for Judges */}
      <div className="border-t border-slate-900 bg-slate-950/90 px-4 py-2 hidden sm:flex items-center justify-between text-[11px] font-mono text-slate-400">
        <div className="flex items-center space-x-2">
          <span className="text-cyan-400 font-bold uppercase tracking-wider text-[10px]">3-Min Walkthrough:</span>
          
          <button
            onClick={() => onTriggerInterruption?.()}
            className="px-2 py-0.5 rounded bg-rose-950/50 hover:bg-rose-900/80 text-rose-300 border border-rose-800/80 transition-colors"
          >
            1. Cut Supply
          </button>
          
          <ChevronRight className="w-3 h-3 text-slate-600" />
          
          <Link
            href="/#holds"
            className="px-2 py-0.5 rounded bg-amber-950/50 hover:bg-amber-900/80 text-amber-300 border border-amber-800/80 transition-colors"
          >
            2. Safe HOLD
          </Link>
          
          <ChevronRight className="w-3 h-3 text-slate-600" />
          
          <Link
            href="/field"
            className="px-2 py-0.5 rounded bg-cyan-950/50 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-800/80 transition-colors"
          >
            3. Field Checks
          </Link>
          
          <ChevronRight className="w-3 h-3 text-slate-600" />
          
          <Link
            href="/supervisor"
            className="px-2 py-0.5 rounded bg-purple-950/50 hover:bg-purple-900/80 text-purple-300 border border-purple-800/80 transition-colors"
          >
            4. Supervisor Gate
          </Link>
          
          <ChevronRight className="w-3 h-3 text-slate-600" />
          
          <Link
            href="/audit"
            className="px-2 py-0.5 rounded bg-emerald-950/50 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/80 transition-colors"
          >
            5. Audit Trail
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
