'use client';

import { useState, useEffect, useCallback } from 'react';
import { WaterZone, RestartEvent, AuditEvent, VerificationSubmission, SupervisorDecision, ConfirmedFieldReport } from '@/types';
import { createInitialZones } from '@/lib/synthetic-data';

export interface SimulationStateData {
  zones: WaterZone[];
  restartEvents: Record<string, RestartEvent>;
  auditTrail: AuditEvent[];
  currentSimulatedTime: string;
}

export function useSimulationState(pollIntervalMs = 3000) {
  const [data, setData] = useState<SimulationStateData>(() => {
    try {
      const init = createInitialZones();
      return {
        zones: init.zones,
        restartEvents: init.events,
        auditTrail: init.audits,
        currentSimulatedTime: new Date().toISOString(),
      };
    } catch {
      return {
        zones: [],
        restartEvents: {},
        auditTrail: [],
        currentSimulatedTime: new Date().toISOString(),
      };
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch('/api/simulation/state', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
        setError(null);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch simulation state';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchState();
    if (pollIntervalMs > 0) {
      const interval = setInterval(fetchState, pollIntervalMs);
      return () => clearInterval(interval);
    }
  }, [fetchState, pollIntervalMs]);

  const triggerInterruption = async (zoneId: string) => {
    try {
      const res = await fetch('/api/simulation/interruption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zoneId }),
      });
      await fetchState();
      return await res.json();
    } catch (err) {
      console.error('Trigger interruption failed:', err);
    }
  };

  const advanceSimulation = async (hours = 1) => {
    try {
      const res = await fetch('/api/simulation/advance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hours }),
      });
      await fetchState();
      return await res.json();
    } catch (err) {
      console.error('Advance simulation failed:', err);
    }
  };

  const resetSimulation = async () => {
    try {
      const res = await fetch('/api/simulation/reset', { method: 'POST' });
      await fetchState();
      return await res.json();
    } catch (err) {
      console.error('Reset simulation failed:', err);
    }
  };

  const requestRestart = async (zoneId: string, actor = 'Operator J. Vance') => {
    try {
      const zone = data.zones.find((z) => z.id === zoneId);
      const eventId = zone?.activeRestartEventId || 'NEW';
      const res = await fetch(`/api/restart-events/${eventId}/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actor, zoneId }),
      });
      await fetchState();
      return await res.json();
    } catch (err) {
      console.error('Request restart failed:', err);
    }
  };

  const submitVerification = async (submission: VerificationSubmission) => {
    try {
      const res = await fetch(`/api/restart-events/${submission.eventId}/verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submission),
      });
      await fetchState();
      return await res.json();
    } catch (err) {
      console.error('Submit verification failed:', err);
      throw err;
    }
  };

  const supervisorReview = async (
    decision: SupervisorDecision & { actionType?: 'APPROVE' | 'REJECT_HOLD' | 'REQUEST_MORE_VERIFICATION' }
  ) => {
    try {
      const res = await fetch(`/api/restart-events/${decision.eventId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(decision),
      });
      await fetchState();
      return await res.json();
    } catch (err) {
      console.error('Supervisor review failed:', err);
      throw err;
    }
  };

  const updateFieldTask = async (
    eventId: string,
    taskId: string,
    update: {
      status?: string;
      measurementsRecorded?: Record<string, number>;
      fieldNotes?: string;
      photoUrl?: string;
    }
  ) => {
    try {
      const res = await fetch(`/api/restart-events/${eventId}/task/${taskId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(update),
      });
      await fetchState();
      return await res.json();
    } catch (err) {
      console.error('Update task failed:', err);
      throw err;
    }
  };

  const commitFieldReport = async (
    eventId: string,
    report: Omit<ConfirmedFieldReport, 'id' | 'confirmedAt'>
  ) => {
    try {
      const res = await fetch(`/api/restart-events/${eventId}/field-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report),
      });
      await fetchState();
      return await res.json();
    } catch (err) {
      console.error('Commit field report failed:', err);
      throw err;
    }
  };

  return {
    ...data,
    loading,
    error,
    refresh: fetchState,
    triggerInterruption,
    advanceSimulation,
    resetSimulation,
    requestRestart,
    submitVerification,
    supervisorReview,
    updateFieldTask,
    commitFieldReport,
  };
}
