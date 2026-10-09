'use client';

import React, { useState, useEffect } from 'react';
import { Navigation } from '@/components/ui/Navigation';
import { AuditLogView } from '@/components/audit/AuditLogView';
import { store } from '@/lib/store';
import { AuditEvent, WaterZone } from '@/types';

export default function AuditPage() {
  const [audits, setAudits] = useState<AuditEvent[]>([]);
  const [zones, setZones] = useState<WaterZone[]>([]);

  useEffect(() => {
    setAudits(store.getAuditTrail());
    setZones(store.getZones());
  }, []);

  return (
    <div>
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <AuditLogView audits={audits} zones={zones} />
      </div>
    </div>
  );
}
