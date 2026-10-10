'use client';

import React, { useState } from 'react';
import { Navigation } from '@/components/ui/Navigation';
import { FieldWorkerMode } from '@/components/field/FieldWorkerMode';
import { useSimulationState } from '@/lib/useSimulationState';

export default function HomePage() {
  const [lang, setLang] = useState<'en' | 'ta'>('en');

  const {
    zones,
    restartEvents,
    loading,
    submitVerification,
    triggerInterruption,
    advanceSimulation,
    resetSimulation,
  } = useSimulationState(3000);

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation
        lang={lang}
        onToggleLang={() => setLang(lang === 'en' ? 'ta' : 'en')}
        onReset={resetSimulation}
        onAdvance={() => advanceSimulation(1)}
        onTriggerInterruption={() => triggerInterruption('zone-5')}
      />

      <div className="flex-1 max-w-6xl mx-auto px-4 py-8 w-full">
        {loading ? (
          <div className="p-16 text-center text-xs text-slate-500 animate-pulse">
            Loading water zones...
          </div>
        ) : (
          <FieldWorkerMode
            zones={zones}
            events={restartEvents}
            onVerificationSubmitted={submitVerification}
            lang={lang}
            onToggleLang={() => setLang(lang === 'en' ? 'ta' : 'en')}
          />
        )}
      </div>
    </div>
  );
}
