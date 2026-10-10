'use client';

import React from 'react';
import { Navigation } from '@/components/ui/Navigation';
import { AuditLogView } from '@/components/audit/AuditLogView';
import { useSimulationState } from '@/lib/useSimulationState';

export default function AuditPage() {
  const {
    zones,
    auditTrail,
    loading,
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
        {loading && auditTrail.length === 0 ? (
          <div className="p-16 text-center text-sm text-slate-500 animate-pulse">
            Loading safety audit records...
          </div>
        ) : (
          <AuditLogView audits={auditTrail} zones={zones} />
        )}
      </div>
    </div>
  );
}
