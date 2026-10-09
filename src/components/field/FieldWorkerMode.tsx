'use client';

import React, { useState } from 'react';
import {
  ClipboardCheck,
  CheckCircle,
  Camera,
  Droplet,
  Send,
  AlertTriangle,
  Info,
  CheckSquare,
  Square,
  FlaskConical,
  Gauge,
  Upload,
} from 'lucide-react';
import { WaterZone, RestartEvent } from '@/types';
import { DEMO_THRESHOLDS } from '@/lib/constants';

interface FieldWorkerModeProps {
  zones: WaterZone[];
  events: Record<string, RestartEvent>;
  onVerificationSubmitted?: () => void;
}

export function FieldWorkerMode({
  zones,
  events,
  onVerificationSubmitted,
}: FieldWorkerModeProps) {
  // Find zones requiring verification or currently held
  const candidateZones = zones.filter(
    (z) =>
      z.operationalState === 'VERIFICATION_REQUIRED' ||
      z.operationalState === 'HOLD' ||
      z.operationalState === 'INTERRUPTED'
  );

  const [selectedZoneId, setSelectedZoneId] = useState<string>(
    candidateZones[0]?.id || zones[0]?.id || 'zone-1'
  );

  const currentZone = zones.find((z) => z.id === selectedZoneId);
  const activeEvent = currentZone?.activeRestartEventId
    ? events[currentZone.activeRestartEventId]
    : undefined;

  // Form states
  const [techName, setTechName] = useState('Tech A. Rivera (Field ID #2041)');
  const [leakSecured, setLeakSecured] = useState(true);
  const [flushingDone, setFlushingDone] = useState(true);
  const [freeChlorine, setFreeChlorine] = useState('0.42');
  const [turbidity, setTurbidity] = useState('0.35');
  const [observedPressure, setObservedPressure] = useState('28.5');
  const [notes, setNotes] = useState('Terminal hydrant H-401 flushed for 15 min until clear. Free chlorine residual stable.');
  const [photoAttached, setPhotoAttached] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitFeedback, setSubmitFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Quick Presets to let judges quickly test passing vs failing scenarios
  const applyPresetPassing = () => {
    setLeakSecured(true);
    setFlushingDone(true);
    setFreeChlorine('0.45');
    setTurbidity('0.32');
    setObservedPressure('30.0');
    setPhotoAttached(true);
    setNotes('Passing field verification: Hydrant scour flush complete. Free chlorine confirmed >= 0.20 mg/L.');
  };

  const applyPresetFailing = () => {
    setLeakSecured(false);
    setFlushingDone(true);
    setFreeChlorine('0.06'); // Fail!
    setTurbidity('1.40');
    setObservedPressure('18.0');
    setPhotoAttached(false);
    setNotes('Failing test: Chlorine residual depleted below 0.20 mg/L limit. Re-flushing required.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEvent) {
      setSubmitFeedback({ type: 'error', message: 'No active restart event for this zone.' });
      return;
    }

    setIsSubmitting(true);
    setSubmitFeedback(null);

    try {
      const res = await fetch(`/api/restart-events/${activeEvent.id}/verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submittedBy: techName,
          role: 'WATER_QUALITY_SPECIALIST',
          freeChlorineMgL: parseFloat(freeChlorine),
          turbidityNtu: parseFloat(turbidity),
          observedPressurePsi: parseFloat(observedPressure),
          flushingCompleted: flushingDone,
          leakInspectedAndSecured: leakSecured,
          photoProofAttached: photoAttached,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setSubmitFeedback({
          type: 'error',
          message: data.error || 'Verification rejected by validation engine.',
        });
      } else {
        setSubmitFeedback({
          type: 'success',
          message: 'Evidence submitted successfully! Workflow advanced to Supervisor Approval.',
        });
        if (onVerificationSubmitted) onVerificationSubmitted();
      }
    } catch {
      setSubmitFeedback({ type: 'error', message: 'Network communication failure.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
            <ClipboardCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold font-mono text-slate-100 uppercase tracking-wider">
              Field Worker Verification Mode
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              Mobile-optimized checklist for line technicians & water quality officers
            </p>
          </div>
        </div>

        {/* Demo Quick Presets */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center gap-2 font-mono text-xs">
          <span className="text-slate-400 text-[11px]">Judge Scenarios:</span>
          <button
            type="button"
            onClick={applyPresetPassing}
            className="px-2.5 py-1 rounded bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 text-[11px] font-semibold transition-colors"
          >
            Load Passing Sample (0.45 mg/L)
          </button>
          <button
            type="button"
            onClick={applyPresetFailing}
            className="px-2.5 py-1 rounded bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 text-[11px] font-semibold transition-colors"
          >
            Load Failing Sample (0.06 mg/L)
          </button>
        </div>
      </div>

      {/* Zone Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 font-mono text-xs">
        <label className="block text-slate-400 mb-2 uppercase font-semibold text-[11px]">
          Assigned Distribution Zone:
        </label>
        <select
          value={selectedZoneId}
          onChange={(e) => setSelectedZoneId(e.target.value)}
          className="w-full bg-slate-950 border border-slate-700 rounded-md p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
        >
          {zones.map((z) => (
            <option key={z.id} value={z.id}>
              {z.name} ({z.code}) — Status: {z.operationalState}
            </option>
          ))}
        </select>

        {activeEvent && (
          <div className="mt-3 p-2.5 bg-slate-950 rounded border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">Active Restart Event:</span>
            <span className="font-bold text-cyan-400">{activeEvent.id}</span>
          </div>
        )}
      </div>

      {/* Main Field Form */}
      <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
        {/* Verification Checklist */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200 border-b border-slate-800 pb-2 flex items-center space-x-2">
            <CheckSquare className="w-4 h-4 text-cyan-400" />
            <span>1. Field Actions Checklist</span>
          </h2>

          <div className="space-y-3">
            <label className="flex items-start space-x-3 cursor-pointer p-2.5 rounded bg-slate-950 border border-slate-800 hover:border-slate-700">
              <input
                type="checkbox"
                checked={leakSecured}
                onChange={(e) => setLeakSecured(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-cyan-500 focus:ring-0 bg-slate-900 border-slate-700"
              />
              <div>
                <span className="font-semibold text-slate-200">
                  Inspect & Secure Physical Leak Locations
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Confirm damaged mains or collars are repaired or isolated prior to system recharging.
                </p>
              </div>
            </label>

            <label className="flex items-start space-x-3 cursor-pointer p-2.5 rounded bg-slate-950 border border-slate-800 hover:border-slate-700">
              <input
                type="checkbox"
                checked={flushingDone}
                onChange={(e) => setFlushingDone(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-cyan-500 focus:ring-0 bg-slate-900 border-slate-700"
              />
              <div>
                <span className="font-semibold text-slate-200">
                  Execute Authorized Main Flushing Procedure
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Perform terminal hydrant scouring flush until turbidity clears to purge biofilm slough.
                </p>
              </div>
            </label>

            <label className="flex items-start space-x-3 cursor-pointer p-2.5 rounded bg-slate-950 border border-slate-800 hover:border-slate-700">
              <input
                type="checkbox"
                checked={photoAttached}
                onChange={(e) => setPhotoAttached(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-cyan-500 focus:ring-0 bg-slate-900 border-slate-700"
              />
              <div>
                <span className="font-semibold text-slate-200 flex items-center space-x-1.5">
                  <Camera className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Attach Field Photographic Proof (Simulated S3 Upload)</span>
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Captures geo-tagged photo of hydrant outflow clarity and repair sleeve.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Physical Measurements Entry */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200 border-b border-slate-800 pb-2 flex items-center space-x-2">
            <FlaskConical className="w-4 h-4 text-cyan-400" />
            <span>2. Water Quality & Pressure Telemetry Verification</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 mb-1 text-[11px]">
                Free Chlorine (mg/L):
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="5.0"
                required
                value={freeChlorine}
                onChange={(e) => setFreeChlorine(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-200 focus:outline-none focus:border-cyan-500 font-bold"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Safety floor: &gt;= {DEMO_THRESHOLDS.MIN_REQUIRED_FREE_CHLORINE_MG_L} mg/L
              </span>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 text-[11px]">
                Observed Pressure (psi):
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="100"
                required
                value={observedPressure}
                onChange={(e) => setObservedPressure(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-200 focus:outline-none focus:border-cyan-500 font-bold"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Target: &gt;= {DEMO_THRESHOLDS.MIN_NORMAL_PRESSURE_PSI} psi
              </span>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 text-[11px]">
                Turbidity (NTU):
              </label>
              <input
                type="number"
                step="0.05"
                min="0"
                max="10"
                required
                value={turbidity}
                onChange={(e) => setTurbidity(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-200 focus:outline-none focus:border-cyan-500 font-bold"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Target: &lt;= {DEMO_THRESHOLDS.MAX_ACCEPTABLE_TURBIDITY_NTU} NTU
              </span>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 text-[11px]">
              Technician Field Notes & Narrative:
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Feedback Messages */}
        {submitFeedback && (
          <div
            className={`p-3.5 rounded-lg border flex items-start space-x-2.5 ${
              submitFeedback.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-800 text-emerald-200'
                : 'bg-rose-950/40 border-rose-800 text-rose-200'
            }`}
          >
            {submitFeedback.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <div className="space-y-0.5">
              <span className="font-bold">
                {submitFeedback.type === 'success' ? 'Verification Passed' : 'Verification Blocked'}
              </span>
              <p className="text-[11px] leading-relaxed">{submitFeedback.message}</p>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || !activeEvent}
          className="w-full py-3 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-slate-950 font-bold uppercase tracking-wider text-xs transition-colors flex items-center justify-center space-x-2 shadow-lg disabled:text-slate-500"
        >
          <Send className="w-4 h-4" />
          <span>{isSubmitting ? 'Submitting & Auditing...' : 'Submit Evidence for Supervisor Review'}</span>
        </button>

        <p className="text-[10px] text-slate-500 text-center">
          Notice: Submission records field actions in an immutable audit ledger. Final release requires supervisor approval.
        </p>
      </form>
    </div>
  );
}
