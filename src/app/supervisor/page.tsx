'use client';

import React from 'react';
import { Navigation } from '@/components/ui/Navigation';
import { SupervisorReview } from '@/components/supervisor/SupervisorReview';
import { useSimulationState } from '@/lib/useSimulationState';

export default function SupervisorPage() {
  const {
    zones,
    restartEvents,
    loading,
    supervisorReview,
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
          <div className="p-16 text-center text-sm text-slate-500 animate-pulse">
            Loading Supervisor Review Queue...
          </div>
        ) : (
          <SupervisorReview
            zones={zones}
            events={restartEvents}
            onDecisionSubmitted={supervisorReview}
          />
        )}
      </div>
    </div>
  );
}
