'use client';

import React, { useState } from 'react';
import { AlertTriangle, Info, ChevronDown, ChevronUp, ShieldAlert } from 'lucide-react';
import { SAFETY_DISCLAIMER } from '@/lib/constants';

export function SafetyBanner() {
  const [expanded, setExpanded] = useState(false);

  return (
    <aside aria-label="Demonstration Notice" className="w-full bg-amber-50/90 border-b border-amber-200/80 text-xs text-amber-900">
      <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-2.5 overflow-hidden">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold tracking-wide uppercase bg-amber-200/80 text-amber-900 border border-amber-300">
            <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-800" />
            {SAFETY_DISCLAIMER.SHORT_BANNER}
          </span>
          <span className="text-amber-900 text-xs truncate hidden sm:inline">
            Prototype decision-support environment. All telemetry is simulated demonstration data.
          </span>
        </div>

        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center text-amber-800 hover:text-amber-950 font-medium ml-4 transition-colors shrink-0 text-xs"
        >
          <Info className="w-3.5 h-3.5 mr-1 text-amber-700" />
          <span>Notice & Scope</span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5 ml-1" /> : <ChevronDown className="w-3.5 h-3.5 ml-1" />}
        </button>
      </div>

      {expanded && (
        <div className="bg-amber-100/60 border-t border-amber-200 px-4 py-3 text-amber-950 text-xs leading-relaxed animate-in fade-in duration-150">
          <div className="max-w-6xl mx-auto flex items-start space-x-3">
            <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-1.5">
              <p className="font-semibold text-amber-900">
                SafeRestart Demonstration Guardrails & Engineering Boundaries:
              </p>
              <p>{SAFETY_DISCLAIMER.FULL_DISCLAIMER}</p>
              <p className="text-amber-800 text-[11px]">
                {SAFETY_DISCLAIMER.COMPLIANCE_NOTE}
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
