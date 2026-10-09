'use client';

import React, { useState } from 'react';
import { AlertTriangle, Info, ChevronDown, ChevronUp, ShieldAlert } from 'lucide-react';
import { SAFETY_DISCLAIMER } from '@/lib/constants';

export function SafetyBanner() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="w-full bg-slate-900 border-b border-amber-500/30 text-xs">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-2.5 overflow-hidden">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <AlertTriangle className="w-3 h-3 mr-1 text-amber-400" />
            {SAFETY_DISCLAIMER.SHORT_BANNER}
          </span>
          <span className="text-slate-300 font-mono truncate hidden sm:inline">
            Prototype decision-support environment. Not certified for drinking-water safety releases.
          </span>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center text-amber-400 hover:text-amber-300 font-medium ml-4 transition-colors shrink-0"
        >
          <Info className="w-3.5 h-3.5 mr-1" />
          <span>Safety Notice</span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5 ml-1" /> : <ChevronDown className="w-3.5 h-3.5 ml-1" />}
        </button>
      </div>

      {expanded && (
        <div className="bg-slate-950 border-t border-slate-800 px-4 py-3 text-slate-400 text-xs leading-relaxed animate-in fade-in duration-150">
          <div className="max-w-7xl mx-auto flex items-start space-x-3">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1.5">
              <p className="font-semibold text-slate-200">
                SafeRestart Demonstration Guardrails & Engineering Boundaries:
              </p>
              <p>{SAFETY_DISCLAIMER.FULL_DISCLAIMER}</p>
              <p className="text-slate-500 font-mono text-[11px]">
                {SAFETY_DISCLAIMER.COMPLIANCE_NOTE}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
