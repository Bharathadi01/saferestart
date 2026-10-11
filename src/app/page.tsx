'use client';

import React, { useState } from 'react';
import { Navigation } from '@/components/ui/Navigation';
import { CommandCenter } from '@/components/dashboard/CommandCenter';
import { useSimulationState } from '@/lib/useSimulationState';

export default function HomePage() {
  const [lang, setLang] = useState<'en' | 'ta'>('en');

  const {
    zones,
    restartEvents,
    auditTrail,
    loading,
    triggerInterruption,
    advanceSimulation,
    resetSimulation,
    requestRestart,
  } = useSimulationState(3000);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navigation
        lang={lang}
        onToggleLang={() => setLang(lang === 'en' ? 'ta' : 'en')}
        onReset={resetSimulation}
        onAdvance={() => advanceSimulation(1)}
        onTriggerInterruption={() => triggerInterruption('zone-5')}
      />

      <div className="flex-1 max-w-6xl mx-auto px-4 py-6 sm:py-8 w-full">
        {loading && zones.length === 0 ? (
          <div className="p-16 text-center text-xs text-slate-500 animate-pulse">
            Loading municipal water network operations...
          </div>
        ) : (
          <CommandCenter
            zones={zones}
            events={restartEvents}
            recentAudits={auditTrail}
            onTriggerInterruption={triggerInterruption}
            onInitiateRestart={requestRestart}
          />
        )}
      </div>
    </div>
  );
}
