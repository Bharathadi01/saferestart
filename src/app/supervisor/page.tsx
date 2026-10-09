'use client';

import React, { useState, useEffect } from 'react';
import { Navigation } from '@/components/ui/Navigation';
import { SupervisorReview } from '@/components/supervisor/SupervisorReview';
import { store } from '@/lib/store';
import { WaterZone, RestartEvent } from '@/types';

export default function SupervisorPage() {
  const [zones, setZones] = useState<WaterZone[]>([]);
  const [events, setEvents] = useState<Record<string, RestartEvent>>({});

  const refresh = () => {
    setZones([...store.getZones()]);
    const eventMap: Record<string, RestartEvent> = {};
    store.getRestartEvents().forEach((e) => {
      eventMap[e.id] = e;
    });
    setEvents({ ...eventMap });
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div>
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <SupervisorReview
          zones={zones}
          events={events}
          onDecisionSubmitted={refresh}
        />
      </div>
    </div>
  );
}
