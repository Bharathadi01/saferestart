'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Navigation } from '@/components/ui/Navigation';
import { RestartEventDetail } from '@/components/restart/RestartEventDetail';
import { store } from '@/lib/store';
import { RestartEvent, WaterZone, AuditEvent } from '@/types';
import { ArrowLeft } from 'lucide-react';

export default function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;

  const [event, setEvent] = useState<RestartEvent | undefined>(undefined);
  const [zone, setZone] = useState<WaterZone | undefined>(undefined);
  const [audits, setAudits] = useState<AuditEvent[]>([]);

  useEffect(() => {
    const currentEvent = store.getRestartEvent(eventId);
    setEvent(currentEvent);

    if (currentEvent) {
      setZone(store.getZone(currentEvent.zoneId));
      setAudits(store.getAuditTrail(currentEvent.zoneId, eventId));
    }
  }, [eventId]);

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
      <Navigation />

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
