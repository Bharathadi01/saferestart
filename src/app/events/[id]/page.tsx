'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { Navigation } from '@/components/ui/Navigation';
import { RestartEventDetail } from '@/components/restart/RestartEventDetail';
import { useSimulationState } from '@/lib/useSimulationState';
import { ArrowLeft } from 'lucide-react';

export default function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;

  const {
    zones,
    restartEvents,
    auditTrail,
    loading,
    resetSimulation,
    advanceSimulation,
    triggerInterruption,
  } = useSimulationState(3000);

  const event = restartEvents[eventId];
  const zone = event ? zones.find((z) => z.id === event.zoneId) : undefined;
  const audits = auditTrail.filter((a) => a.eventId === eventId);

  if (loading && !event) {
    return (
      <div>
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 py-16 text-center font-mono text-xs text-slate-500 animate-pulse">
          Loading Restart Event Lifecycle...
        </div>
      </div>
    );
  }

  if (!event || !zone) {
    return (
      <div>
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 py-12 text-center font-mono text-sm text-slate-500">
          Restart Event {eventId} not found.
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navigation
        onReset={resetSimulation}
        onAdvance={() => advanceSimulation(1)}
        onTriggerInterruption={() => triggerInterruption('zone-5')}
      />

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
        <Link
          href={`/zones/${zone.id}`}
          className="inline-flex items-center text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          <span>Back to Zone: {zone.name}</span>
        </Link>

        <RestartEventDetail event={event} zone={zone} audits={audits} />
      </div>
    </div>
  );
}
