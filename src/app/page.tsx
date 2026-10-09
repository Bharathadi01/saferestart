'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Navigation } from '@/components/ui/Navigation';
import { CommandCenter } from '@/components/dashboard/CommandCenter';
import { WaterZone, RestartEvent, AuditEvent } from '@/types';
import { store } from '@/lib/store';

export default function HomePage() {
  const [zones, setZones] = useState<WaterZone[]>([]);
  const [events, setEvents] = useState<Record<string, RestartEvent>>({});
  const [audits, setAudits] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(() => {
    // In local Next.js client, store singleton provides fast instant reactivity
    const currentZones = store.getZones();
    const currentEventsList = store.getRestartEvents();
    const currentAudits = store.getAuditTrail();

    const eventMap: Record<string, RestartEvent> = {};
    currentEventsList.forEach((e) => {
      eventMap[e.id] = e;
    });

    setZones([...currentZones]);
    setEvents({ ...eventMap });
    setAudits([...currentAudits]);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
    // 3-second gentle polling to simulate automatic SCADA refresh
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleTriggerInterruption = async (zoneId = 'zone-5') => {
    await fetch('/api/simulation/interruption', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ zoneId }),
    });
    loadData();
  };

  const handleInitiateRestart = async (zoneId: string) => {
    const zone = zones.find((z) => z.id === zoneId);
    if (!zone || !zone.activeRestartEventId) return;

    await fetch(`/api/restart-events/${zone.activeRestartEventId}/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actor: 'Operator J. Vance' }),
    });
    loadData();
  };

  const handleAdvance = async () => {
    await fetch('/api/simulation/advance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hours: 1 }),
    });
    loadData();
  };

  const handleReset = async () => {
    await fetch('/api/simulation/reset', { method: 'POST' });
    loadData();
  };

  return (
    <div>
      <Navigation
        onReset={handleReset}
        onAdvance={handleAdvance}
        onTriggerInterruption={() => handleTriggerInterruption('zone-5')}
      />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="p-12 text-center font-mono text-xs text-slate-500 animate-pulse">
            Connecting to SCADA Telemetry Stream...
          </div>
        ) : (
          <CommandCenter
            zones={zones}
            events={events}
            recentAudits={audits}
            onTriggerInterruption={handleTriggerInterruption}
            onInitiateRestart={handleInitiateRestart}
          />
        )}
      </div>
    </div>
  );
}
