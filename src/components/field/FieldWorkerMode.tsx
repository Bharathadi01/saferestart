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
  Clock,
  ChevronDown,
  ChevronUp,
  FileText,
  AlertOctagon,
} from 'lucide-react';
import { WaterZone, RestartEvent, FieldTask, VerificationSubmission } from '@/types';
import { DEMO_THRESHOLDS } from '@/lib/constants';

interface FieldWorkerModeProps {
  zones: WaterZone[];
  events: Record<string, RestartEvent>;
  onVerificationSubmitted?: (submission: VerificationSubmission) => Promise<{ success: boolean; outcome?: string; reasons?: string[] } | void>;
  onTaskUpdated?: (eventId: string, taskId: string, update: { status?: string; measurementsRecorded?: Record<string, number>; fieldNotes?: string; photoUrl?: string }) => Promise<void>;
}

export function FieldWorkerMode({
  zones,
  events,
  onVerificationSubmitted,
  onTaskUpdated,
}: FieldWorkerModeProps) {
  // Find zones that have an active restart event
  const candidateZones = zones.filter((z) => z.activeRestartEventId && events[z.activeRestartEventId]);

  const [selectedZoneId, setSelectedZoneId] = useState<string>(
    candidateZones[0]?.id || zones[0]?.id || 'zone-1'
  );

  const currentZone = zones.find((z) => z.id === selectedZoneId);
  const activeEvent = currentZone?.activeRestartEventId
    ? events[currentZone.activeRestartEventId]
    : undefined;

  // Active technician information
  const [techName, setTechName] = useState('Tech A. Rivera (Field ID #2041)');
  const [techRole, setTechRole] = useState<'FIELD_TECHNICIAN' | 'WATER_QUALITY_SPECIALIST'>('WATER_QUALITY_SPECIALIST');

  // Interactive task form values
  const [freeChlorine, setFreeChlorine] = useState('0.42');
  const [turbidity, setTurbidity] = useState('0.35');
  const [observedPressure, setObservedPressure] = useState('28.5');
  const [flushingMinutes, setFlushingMinutes] = useState('15');
  const [leakSecured, setLeakSecured] = useState(true);
  const [flushingDone, setFlushingDone] = useState(true);
  const [photoAttached, setPhotoAttached] = useState(true);
  const [notes, setNotes] = useState('Terminal hydrant flushed until clear. Free chlorine residual stable and verified.');

  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'warning' | 'error';
    title: string;
    messages: string[];
  } | null>(null);

  // Quick Preset Handlers
  const applyPresetPassing = () => {
    setFreeChlorine('0.45');
    setTurbidity('0.32');
    setObservedPressure('30.0');
    setFlushingMinutes('15');
    setFlushingDone(true);
    setLeakSecured(true);
    setPhotoAttached(true);
    setNotes('Passing field verification: Hydrant scour flush complete. Free chlorine confirmed >= 0.20 mg/L.');
    setFeedback(null);
  };

  const applyPresetFailing = () => {
    setFreeChlorine('0.06'); // Critical failure! < 0.20 mg/L
    setTurbidity('1.40');
    setObservedPressure('18.0');
    setFlushingMinutes('5');
    setFlushingDone(true);
    setLeakSecured(false);
    setPhotoAttached(false);
    setNotes('Failing test: Free chlorine depleted below 0.20 mg/L limit. Re-flushing required.');
    setFeedback(null);
  };

  const handleCompleteSingleTask = async (task: FieldTask) => {
    if (!activeEvent || !onTaskUpdated) return;
    try {
      await onTaskUpdated(activeEvent.id, task.id, {
        status: 'COMPLETED',
        fieldNotes: notes,
        measurementsRecorded:
          task.taskType === 'MEASURE_CHLORINE'
            ? { chlorineMgL: parseFloat(freeChlorine), turbidityNtu: parseFloat(turbidity), pressurePsi: parseFloat(observedPressure) }
            : task.taskType === 'FLUSH_HYDRANT'
            ? { flushingDurationMinutes: parseFloat(flushingMinutes) }
            : undefined,
        photoUrl: photoAttached ? 's3://saferestart-evidence/photos/sample-proof.jpg' : undefined,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEvent) {
      setFeedback({
        type: 'error',
        title: 'No Active Restart Event',
        messages: ['This zone does not have an active restart event to verify.'],
      });
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    const submission: VerificationSubmission = {
      eventId: activeEvent.id,
      submittedBy: techName,
      role: techRole,
      timestamp: new Date().toISOString(),
      freeChlorineMgL: parseFloat(freeChlorine),
      turbidityNtu: parseFloat(turbidity),
      observedPressurePsi: parseFloat(observedPressure),
      flushingCompleted: flushingDone,
      leakInspectedAndSecured: leakSecured,
      photoProofAttached: photoAttached,
      notes,
    };

    try {
      if (onVerificationSubmitted) {
        const result = await onVerificationSubmitted(submission);
        if (result && result.outcome === 'FAILED') {
          setFeedback({
            type: 'warning',
            title: 'VERIFICATION FAILED — OPERATIONAL HOLD ENFORCED',
            messages: result.reasons || ['Field parameters did not meet configured safety floors.'],
          });
        } else {
          setFeedback({
            type: 'success',
            title: 'VERIFICATION PASSED — MOVED TO SUPERVISOR APPROVAL',
            messages: [
              'All field tasks and water-quality criteria passed demonstration parameters.',
              'Workflow has advanced to Awaiting Supervisor Approval.',
            ],
          });
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Submission failed';
      setFeedback({
        type: 'error',
        title: 'Submission Error',
        messages: [msg],
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800 shrink-0">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold font-mono text-slate-100 uppercase tracking-wider">
                Field Technician Verification Mode
              </h1>
              <p className="text-xs text-slate-400 font-mono">
                Mobile-first protocol for line flushing, leak inspection, and residual testing
              </p>
            </div>
          </div>

          {/* Preset Buttons for Testing */}
          <div className="flex items-center space-x-2 font-mono text-xs">
            <button
              type="button"
              onClick={applyPresetPassing}
              className="px-2.5 py-1 rounded bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 text-[11px] font-bold transition-colors"
            >
              Preset: Passing (0.45 mg/L)
            </button>
            <button
              type="button"
              onClick={applyPresetFailing}
              className="px-2.5 py-1 rounded bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 text-[11px] font-bold transition-colors"
            >
              Preset: Failing (0.06 mg/L)
            </button>
          </div>
        </div>
      </div>

      {/* Zone Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 font-mono text-xs">
        <label className="block text-slate-400 mb-1.5 uppercase font-semibold text-[11px]">
          Assigned Distribution Sector:
        </label>
        <select
          value={selectedZoneId}
          onChange={(e) => {
            setSelectedZoneId(e.target.value);
            setFeedback(null);
          }}
          className="w-full bg-slate-950 border border-slate-700 rounded-md p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
        >
          {zones.map((z) => (
            <option key={z.id} value={z.id}>
              {z.name} ({z.code}) — Status: {z.operationalState}
            </option>
          ))}
        </select>

        {activeEvent && (
          <div className="mt-3 p-2.5 bg-slate-950 rounded border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px]">
            <div>
              <span className="text-slate-400">Restart Event ID: </span>
              <span className="font-bold text-cyan-400">{activeEvent.id}</span>
            </div>
            <div>
              <span className="text-slate-400">Current Lifecycle State: </span>
              <span className="font-bold text-amber-300">{activeEvent.state}</span>
            </div>
          </div>
        )}
      </div>

      {activeEvent ? (
        <form onSubmit={handleSubmitVerification} className="space-y-5 font-mono text-xs">
          {/* Section 1: Assigned Field Tasks */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center space-x-2">
                <CheckSquare className="w-4 h-4 text-cyan-400" />
                <span>1. Required Field Directives ({activeEvent.fieldTasks.length})</span>
              </h2>
              <span className="text-[10px] text-slate-400">
                {activeEvent.fieldTasks.filter((t) => t.status === 'COMPLETED').length} / {activeEvent.fieldTasks.length} Completed
              </span>
            </div>

            <div className="space-y-3">
              {activeEvent.fieldTasks.map((task) => {
                const isCompleted = task.status === 'COMPLETED';
                return (
                  <div
                    key={task.id}
                    className={`p-3.5 rounded-lg border transition-all ${
                      isCompleted
                        ? 'bg-slate-950/80 border-emerald-900/60'
                        : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${
                              isCompleted
                                ? 'bg-emerald-900/60 text-emerald-300'
                                : 'bg-amber-900/60 text-amber-300'
                            }`}
                          >
                            {task.status}
                          </span>
                          <span className="font-bold text-slate-200">{task.title}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-snug">{task.description}</p>
                      </div>

                      {!isCompleted && onTaskUpdated && (
                        <button
                          type="button"
                          onClick={() => handleCompleteSingleTask(task)}
                          className="shrink-0 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-[11px] transition-colors"
                        >
                          Mark Done
                        </button>
                      )}
                    </div>

                    {isCompleted && task.measurementsRecorded && (
                      <div className="mt-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 flex flex-wrap gap-4">
                        {task.measurementsRecorded.chlorineMgL !== undefined && (
                          <span>Chlorine: <b className="text-emerald-400">{task.measurementsRecorded.chlorineMgL} mg/L</b></span>
                        )}
                        {task.measurementsRecorded.pressurePsi !== undefined && (
                          <span>Pressure: <b className="text-cyan-400">{task.measurementsRecorded.pressurePsi} psi</b></span>
                        )}
                        {task.measurementsRecorded.flushingDurationMinutes !== undefined && (
                          <span>Flushed: <b className="text-slate-200">{task.measurementsRecorded.flushingDurationMinutes} mins</b></span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Physical Verification Checklist */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200 border-b border-slate-800 pb-2 flex items-center space-x-2">
              <CheckSquare className="w-4 h-4 text-cyan-400" />
              <span>2. Physical Action Confirmations</span>
            </h2>

            <div className="space-y-3">
              <label className="flex items-start space-x-3 cursor-pointer p-3 rounded bg-slate-950 border border-slate-800 hover:border-slate-700">
                <input
                  type="checkbox"
                  checked={leakSecured}
                  onChange={(e) => setLeakSecured(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-cyan-500 bg-slate-900 border-slate-700"
                />
                <div>
                  <span className="font-semibold text-slate-200">
                    Pipe Leak / Joint Integrity Secured
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Repair clamp or isolation sleeve verified stable to prevent groundwater ingress during recharge.
                  </p>
                </div>
              </label>

              <label className="flex items-start space-x-3 cursor-pointer p-3 rounded bg-slate-950 border border-slate-800 hover:border-slate-700">
                <input
                  type="checkbox"
                  checked={flushingDone}
                  onChange={(e) => setFlushingDone(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-cyan-500 bg-slate-900 border-slate-700"
                />
                <div>
                  <span className="font-semibold text-slate-200">
                    Terminal Hydrant Scour Flushing Completed
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Main flushed for minimum 15 minutes to purge stagnant biofilm deposits and particulate.
                  </p>
                </div>
              </label>

              <label className="flex items-start space-x-3 cursor-pointer p-3 rounded bg-slate-950 border border-slate-800 hover:border-slate-700">
                <input
                  type="checkbox"
                  checked={photoAttached}
                  onChange={(e) => setPhotoAttached(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-cyan-500 bg-slate-900 border-slate-700"
                />
                <div>
                  <span className="font-semibold text-slate-200 flex items-center space-x-1.5">
                    <Camera className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Attach Photographic Chain of Custody</span>
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Simulated S3 encrypted photo upload of hydrant discharge clarity and colorimeter vial.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Section 3: Water Quality Measurements Entry */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200 border-b border-slate-800 pb-2 flex items-center space-x-2">
              <FlaskConical className="w-4 h-4 text-cyan-400" />
              <span>3. Water Quality & Hydraulic Measurements</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 mb-1 text-[11px] font-semibold">
                  Free Chlorine Residual (mg/L):
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
                  Safety Floor: &gt;= {DEMO_THRESHOLDS.MIN_REQUIRED_FREE_CHLORINE_MG_L} mg/L
                </span>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 text-[11px] font-semibold">
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
                <label className="block text-slate-400 mb-1 text-[11px] font-semibold">
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
              <label className="block text-slate-400 mb-1 text-[11px] font-semibold">
                Field Technician Notes:
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Feedback Display */}
          {feedback && (
            <div
              className={`p-4 rounded-lg border space-y-1.5 ${
                feedback.type === 'success'
                  ? 'bg-emerald-950/40 border-emerald-800 text-emerald-200'
                  : feedback.type === 'warning'
                  ? 'bg-amber-950/40 border-amber-800 text-amber-200'
                  : 'bg-rose-950/40 border-rose-800 text-rose-200'
              }`}
            >
              <div className="flex items-center space-x-2 font-bold text-xs uppercase tracking-wide">
                {feedback.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertOctagon className="w-4 h-4 text-amber-400" />
                )}
                <span>{feedback.title}</span>
              </div>
              <ul className="text-[11px] space-y-0.5 pl-5 list-disc opacity-90">
                {feedback.messages.map((m, idx) => (
                  <li key={idx}>{m}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-slate-950 font-bold uppercase tracking-wider text-xs transition-colors flex items-center justify-center space-x-2 shadow-lg disabled:text-slate-500 font-mono"
          >
            <Send className="w-4 h-4" />
            <span>{submitting ? 'Auditing & Validating...' : 'Submit Evidence for Supervisor Review'}</span>
          </button>
        </form>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-8 text-center font-mono text-xs text-slate-400 space-y-2">
          <Info className="w-8 h-8 text-cyan-400 mx-auto" />
          <div className="font-bold text-slate-200">No Active Restart Event for This Zone</div>
          <p>This zone is currently operating normally. Supply interruption has not been triggered.</p>
        </div>
      )}
    </div>
  );
}
