'use client';

import React from 'react';
import { Navigation } from '@/components/ui/Navigation';
import { CommandCenter } from '@/components/dashboard/CommandCenter';
import { useSimulationState } from '@/lib/useSimulationState';

export default function HomePage() {
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
    <div>
      <Navigation
        onReset={resetSimulation}
        onAdvance={() => advanceSimulation(1)}
        onTriggerInterruption={() => triggerInterruption('zone-5')}
      />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="p-16 text-center font-mono text-xs text-slate-500 animate-pulse">
            Connecting to Real-Time SCADA Telemetry Stream...
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
