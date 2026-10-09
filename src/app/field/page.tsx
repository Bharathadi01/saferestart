'use client';

import React from 'react';
import { Navigation } from '@/components/ui/Navigation';
import { FieldWorkerMode } from '@/components/field/FieldWorkerMode';
import { useSimulationState } from '@/lib/useSimulationState';

export default function FieldPage() {
  const {
    zones,
    restartEvents,
    loading,
    submitVerification,
    updateFieldTask,
    resetSimulation,
    advanceSimulation,
    triggerInterruption,
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
            Loading Field Worker Assignments...
          </div>
        ) : (
          <FieldWorkerMode
            zones={zones}
            events={restartEvents}
            onVerificationSubmitted={submitVerification}
            onTaskUpdated={updateFieldTask}
          />
        )}
      </div>
    </div>
  );
}
