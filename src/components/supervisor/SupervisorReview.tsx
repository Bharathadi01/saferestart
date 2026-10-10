'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertOctagon,
  FileCheck,
  Lock,
  Unlock,
  AlertTriangle,
  Send,
  Droplets,
  Calendar,
  Clock,
  ArrowRight,
  RotateCcw,
  PlusCircle,
  ChevronDown,
  ChevronUp,
  Activity,
  Layers,
  Gauge,
  FlaskConical,
  UserCheck,
} from 'lucide-react';
import { WaterZone, RestartEvent, SupervisorDecision } from '@/types';
import { DEMO_THRESHOLDS, ROLE_LABELS } from '@/lib/constants';
import { StatusBadge } from '../ui/StatusBadge';

interface SupervisorReviewProps {
  zones: WaterZone[];
  events: Record<string, RestartEvent>;
  onDecisionSubmitted?: (
    decision: SupervisorDecision & { actionType?: 'APPROVE' | 'REJECT_HOLD' | 'REQUEST_MORE_VERIFICATION' }
  ) => Promise<{ success: boolean; data?: RestartEvent; error?: string } | void>;
}

export function SupervisorReview({
  zones,
  events,
  onDecisionSubmitted,
}: SupervisorReviewProps) {
  // Find reviewable events or list all events for inspection
  const allEvents = Object.values(events);
  const reviewableEvents = allEvents.filter(
    (e) => e.state === 'AWAITING_APPROVAL' || e.state === 'HOLD' || e.state === 'VERIFICATION_REQUIRED'
  );

  const [selectedEventId, setSelectedEventId] = useState<string>(
    reviewableEvents.find((e) => e.state === 'AWAITING_APPROVAL')?.id ||
      reviewableEvents[0]?.id ||
      allEvents[0]?.id ||
      'EVT-2026-004'
  );

  const currentEvent = events[selectedEventId];
  const currentZone = currentEvent ? zones.find((z) => z.id === currentEvent.zoneId) : undefined;

  // Sign-off form states
  const [supervisorName, setSupervisorName] = useState('Chief Engineer Helena Miller, P.E.');
  const [supervisorRole, setSupervisorRole] = useState<'SUPERVISOR' | 'CHIEF_WATER_ENGINEER'>('CHIEF_WATER_ENGINEER');
  const [complianceChecked, setComplianceChecked] = useState(false);
  const [rationale, setRationale] = useState(
    'All statutory checklists satisfied. Free chlorine residual >= 0.20 mg/L verified at terminal point. Main scouring completed.'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Technical drawer toggle
  const [showTechnicalDrawer, setShowTechnicalDrawer] = useState(false);

  // Verification & Safety Evaluation Criteria
  const sub = currentEvent?.verificationSubmission;
  const chlorinePassing = (sub?.freeChlorineMgL ?? 0) >= DEMO_THRESHOLDS.MIN_REQUIRED_FREE_CHLORINE_MG_L;
  const pressurePassing = (sub?.observedPressurePsi ?? 0) >= DEMO_THRESHOLDS.MIN_NORMAL_PRESSURE_PSI;
  const flushingPassing = !!sub?.flushingCompleted;
  const leakPassing = !!sub?.leakInspectedAndSecured;
  const photoPassing = !!sub?.photoProofAttached;

  const isEligibleForApproval =
    currentEvent?.state === 'AWAITING_APPROVAL' &&
    !!sub &&
    chlorinePassing &&
    pressurePassing &&
    flushingPassing &&
    leakPassing;

  const handleDecision = async (actionType: 'APPROVE' | 'REJECT_HOLD' | 'REQUEST_MORE_VERIFICATION') => {
    if (!currentEvent || !onDecisionSubmitted) return;
    setIsSubmitting(true);
    setFeedback(null);

    const decision: SupervisorDecision & { actionType?: 'APPROVE' | 'REJECT_HOLD' | 'REQUEST_MORE_VERIFICATION' } = {
      eventId: currentEvent.id,
      supervisorName,
      supervisorRole,
      decision: actionType === 'APPROVE' ? 'APPROVE' : 'HOLD',
      rationale:
        rationale ||
        (actionType === 'APPROVE'
          ? 'Field parameters verified. Statutory flushing and residual safety protocol documented.'
          : actionType === 'REQUEST_MORE_VERIFICATION'
          ? 'Supervisor ordered additional secondary microbiological sampling before release.'
          : 'Service restoration rejected; operational HOLD enforced.'),
      timestamp: new Date().toISOString(),
      complianceChecksVerified: complianceChecked,
      actionType,
    };

    try {
      const result = await onDecisionSubmitted(decision);
      if (result && !result.success) {
        setFeedback({
          type: 'error',
          message: result.error || 'Decision rejected by authorization policy engine.',
        });
      } else {
        setFeedback({
          type: 'success',
          message:
            actionType === 'APPROVE'
              ? 'Zone service RESTORED! Safe drinking water authorized for public supply.'
              : actionType === 'REQUEST_MORE_VERIFICATION'
              ? 'Additional field verification directive dispatched to field crew.'
              : 'Water supply maintained on operational HOLD. Remediation required.',
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Action failed';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex items-center space-x-3.5 mb-2">
          <div className="w-12 h-12 rounded-xl bg-purple-950 text-purple-300 border border-purple-800 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold font-mono text-slate-100 uppercase tracking-wider">
              Supervisor Verification & Release Authorization Gate
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              Statutory authority review required prior to recharging drinking water distribution sectors
            </p>
          </div>
        </div>

        {/* Event Selector */}
        <div className="mt-4 pt-4 border-t border-slate-800">
          <label className="block text-slate-400 font-mono text-xs uppercase mb-2 font-semibold">
            Select Restart Request to Review:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {allEvents.map((evt) => {
              const z = zones.find((item) => item.id === evt.zoneId);
              const isSelected = selectedEventId === evt.id;
              const isAwaiting = evt.state === 'AWAITING_APPROVAL';
              const isHold = evt.state === 'HOLD';
              return (
                <button
                  key={evt.id}
                  onClick={() => {
                    setSelectedEventId(evt.id);
                    setFeedback(null);
                  }}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    isSelected
                      ? 'bg-slate-800 border-cyan-500 text-cyan-200 ring-2 ring-cyan-500/50'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="font-mono">{evt.id}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase ${
                        isAwaiting
                          ? 'bg-purple-950 text-purple-300 border border-purple-800'
                          : isHold
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : 'bg-teal-950 text-teal-300 border border-teal-800'
                      }`}
                    >
                      {evt.state}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300 truncate mt-1 font-sans font-semibold">
                    {z?.name || 'Unknown Sector'}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {currentEvent && currentZone ? (
        <div className="space-y-6">
          {/* PRIMARY PLAIN-LANGUAGE DECISION PANEL ("THE BIG SIGNAL") */}
          <div
            className={`p-6 rounded-xl border shadow-xl ${
              isEligibleForApproval
                ? 'bg-emerald-950/40 border-emerald-700 text-emerald-100'
                : currentEvent.state === 'RESTORED'
                ? 'bg-teal-950/40 border-teal-700 text-teal-100'
                : 'bg-rose-950/40 border-rose-700 text-rose-100'
            }`}
          >
            <div className="flex items-start space-x-4">
              <div
                className={`p-3 rounded-xl border shrink-0 mt-0.5 ${
                  isEligibleForApproval
                    ? 'bg-emerald-900/60 border-emerald-600 text-emerald-300'
                    : currentEvent.state === 'RESTORED'
                    ? 'bg-teal-900/60 border-teal-600 text-teal-300'
                    : 'bg-rose-900/60 border-rose-600 text-rose-300'
                }`}
              >
                {isEligibleForApproval ? (
                  <Unlock className="w-7 h-7" />
                ) : currentEvent.state === 'RESTORED' ? (
                  <CheckCircle2 className="w-7 h-7" />
                ) : (
                  <Lock className="w-7 h-7" />
                )}
              </div>

              <div className="space-y-2 flex-1">
                <div className="flex items-center space-x-3">
                  <span className="text-lg sm:text-xl font-bold font-mono uppercase tracking-wide">
                    {isEligibleForApproval
                      ? 'DECISION: VERIFICATION PASSED — SUPERVISOR APPROVAL READY'
                      : currentEvent.state === 'RESTORED'
                      ? 'DECISION: ZONE RESTORED & SAFE FOR SUPPLY'
                      : 'DECISION: OPERATIONAL HOLD ENFORCED'}
                  </span>
                </div>

                {/* Plain-Language Explanation of WHY */}
                <p className="text-sm opacity-95 leading-relaxed font-sans">
                  {isEligibleForApproval
                    ? 'All field tests and physical scouring protocols met statutory safety thresholds. Disinfectant residual is verified >= 0.20 mg/L. Chief engineer or supervisor sign-off is authorized to release water.'
                    : currentEvent.state === 'RESTORED'
                    ? 'This distribution zone has passed all microbiological and hydraulic checks and is fully pressurized.'
                    : 'Water pressure dropped below safe level during shutoff. Contamination may have entered pipes through negative-pressure back-siphonage. Physical line flushing and disinfectant residual must be verified before turning water back on.'}
                </p>

                {/* Who Acts Next Callout */}
                <div className="pt-2 flex items-center space-x-2 text-xs font-mono font-bold">
                  <UserCheck className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-300">WHO ACTS NEXT: </span>
                  <span className="text-cyan-300">
                    {isEligibleForApproval
                      ? 'Supervisor Helena Miller (Sign-off required below)'
                      : currentEvent.state === 'RESTORED'
                      ? 'None (Nominal distribution active)'
                      : 'Certified Field Technician (Must flush line & test chlorine in field)'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* VERIFICATION EVIDENCE AUDIT CHECKLIST */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center space-x-2 font-mono">
                <FileCheck className="w-4 h-4 text-cyan-400" />
                <span>Field Evidence Compliance Status</span>
              </h2>
              <span className="text-[11px] font-mono text-slate-400">
                Sector: {currentZone.name} ({currentZone.code})
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Check 1: Chlorine */}
              <div
                className={`p-3.5 rounded-lg border ${
                  chlorinePassing ? 'bg-slate-950 border-emerald-900/60' : 'bg-rose-950/40 border-rose-800'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-400 font-semibold">1. Disinfectant Residual</span>
                  <span className={chlorinePassing ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                    {chlorinePassing ? 'PASS (>= 0.20 mg/L)' : 'FAIL / MISSING'}
                  </span>
                </div>
                <div className="text-lg font-bold font-mono text-slate-100 mt-1">
                  {sub?.freeChlorineMgL !== undefined ? `${sub.freeChlorineMgL.toFixed(2)} mg/L` : 'No Record'}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Protects consumers from coliform and pathogens
                </p>
              </div>

              {/* Check 2: Scour Flushing */}
              <div
                className={`p-3.5 rounded-lg border ${
                  flushingPassing ? 'bg-slate-950 border-emerald-900/60' : 'bg-rose-950/40 border-rose-800'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-400 font-semibold">2. 15-Min Scour Flush</span>
                  <span className={flushingPassing ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                    {flushingPassing ? 'VERIFIED' : 'PENDING'}
                  </span>
                </div>
                <div className="text-base font-bold font-mono text-slate-100 mt-1">
                  {flushingPassing ? 'Completed by Field Crew' : 'Not Recorded'}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Purges accumulated stagnant sediment & biofilm
                </p>
              </div>

              {/* Check 3: Pipe Leak Inspection */}
              <div
                className={`p-3.5 rounded-lg border ${
                  leakPassing ? 'bg-slate-950 border-emerald-900/60' : 'bg-rose-950/40 border-rose-800'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-400 font-semibold">3. Pipe Leak Secured</span>
                  <span className={leakPassing ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                    {leakPassing ? 'SECURED' : 'BREACH SUSPECTED'}
                  </span>
                </div>
                <div className="text-base font-bold font-mono text-slate-100 mt-1">
                  {leakPassing ? 'Repair Clamp Stable' : 'Active Ingress Risk'}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Prevents groundwater infiltration during recharge
                </p>
              </div>

              {/* Check 4: Photo Proof */}
              <div
                className={`p-3.5 rounded-lg border ${
                  photoPassing ? 'bg-slate-950 border-emerald-900/60' : 'bg-amber-950/40 border-amber-800'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-400 font-semibold">4. Photographic Proof</span>
                  <span className={photoPassing ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                    {photoPassing ? 'ATTACHED' : 'UNATTACHED'}
                  </span>
                </div>
                <div className="text-base font-bold font-mono text-slate-100 mt-1">
                  {photoPassing ? 'Clear Water Sample Verified' : 'No Photo Uploaded'}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Simulated S3 visual chain of custody
                </p>
              </div>
            </div>

            {sub?.notes && (
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                <span className="text-slate-400 font-bold font-mono">Field Crew Note: </span>
                <span className="text-slate-300 italic">&quot;{sub.notes}&quot;</span>
                <div className="text-[10px] text-slate-500 font-mono mt-1">
                  Submitted by: {sub.submittedBy} ({new Date(sub.timestamp).toLocaleTimeString()})
                </div>
              </div>
            )}
          </div>

          {/* GATED SUPERVISOR AUTHORIZATION FORM */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                <span>Statutory Release Authorization Sign-Off</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold text-[11px]">
                  Authorized Operator Name:
                </label>
                <input
                  type="text"
                  value={supervisorName}
                  onChange={(e) => setSupervisorName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold text-[11px]">
                  Sign-Off Authority Role:
                </label>
                <select
                  value={supervisorRole}
                  onChange={(e) =>
                    setSupervisorRole(e.target.value as 'SUPERVISOR' | 'CHIEF_WATER_ENGINEER')
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="SUPERVISOR">Distribution Operations Supervisor</option>
                  <option value="CHIEF_WATER_ENGINEER">Chief Water Works Engineer</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold text-[11px]">
                Decision Rationale (Immutable Audit Log Entry):
              </label>
              <textarea
                rows={2}
                value={rationale}
                onChange={(e) => setRationale(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Mandatory Compliance Checkbox */}
            <label className="flex items-start space-x-3 cursor-pointer p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700">
              <input
                type="checkbox"
                checked={complianceChecked}
                onChange={(e) => setComplianceChecked(e.target.checked)}
                className="mt-0.5 w-5 h-5 rounded text-cyan-500 bg-slate-900 border-slate-700 focus:ring-cyan-500"
              />
              <span className="text-slate-300 text-xs leading-relaxed font-sans">
                I hereby certify under statutory guidelines that physical line scouring was executed and free chlorine residual was verified $\ge 0.20$ mg/L prior to authorizing water release.
              </span>
            </label>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleDecision('APPROVE')}
                disabled={isSubmitting || !isEligibleForApproval || !complianceChecked}
                className="w-full sm:w-1/2 min-h-[52px] py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-slate-950 font-bold uppercase tracking-wider text-xs transition-all flex items-center justify-center space-x-2 shadow-lg disabled:text-slate-500 shadow-emerald-950/20"
                title={
                  !isEligibleForApproval
                    ? 'Blocked: Mandatory field verification evidence is incomplete or failed'
                    : !complianceChecked
                    ? 'Please check the statutory certification box above'
                    : 'Authorize release of drinking water'
                }
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Authorize Service Restoration</span>
              </button>

              <button
                type="button"
                onClick={() => handleDecision('REQUEST_MORE_VERIFICATION')}
                disabled={isSubmitting}
                className="w-full sm:w-1/4 min-h-[52px] py-3.5 px-3 rounded-xl bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 font-bold uppercase tracking-wider text-xs transition-colors flex items-center justify-center space-x-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Request More Checks</span>
              </button>

              <button
                type="button"
                onClick={() => handleDecision('REJECT_HOLD')}
                disabled={isSubmitting}
                className="w-full sm:w-1/4 min-h-[52px] py-3.5 px-3 rounded-xl bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 font-bold uppercase tracking-wider text-xs transition-colors flex items-center justify-center space-x-1.5"
              >
                <AlertOctagon className="w-3.5 h-3.5" />
                <span>Enforce HOLD</span>
              </button>
            </div>

            {feedback && (
              <div
                className={`p-3.5 rounded-lg border text-xs font-sans ${
                  feedback.type === 'success'
                    ? 'bg-emerald-950/50 border-emerald-800 text-emerald-200'
                    : 'bg-rose-950/50 border-rose-800 text-rose-200'
                }`}
              >
                {feedback.message}
              </div>
            )}
          </div>

          {/* SECONDARY COLLAPSIBLE DRAWER: TECHNICAL TELEMETRY & ENGINE DETAILS */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
            <button
              type="button"
              onClick={() => setShowTechnicalDrawer(!showTechnicalDrawer)}
              className="w-full p-4 flex items-center justify-between text-left text-xs font-mono font-bold text-slate-300 hover:bg-slate-850 transition-colors"
            >
              <div className="flex items-center space-x-2.5">
                <Gauge className="w-4 h-4 text-cyan-400" />
                <span>Secondary Technical Telemetry & SCADA Sensor Logs (Engine Rules & Pressure Curves)</span>
              </div>
              <div className="flex items-center space-x-1 text-slate-400">
                <span>{showTechnicalDrawer ? 'Hide Details' : 'View SCADA Data'}</span>
                {showTechnicalDrawer ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {showTechnicalDrawer && (
              <div className="p-5 border-t border-slate-800 bg-slate-950 font-mono text-xs space-y-4 animate-in fade-in duration-200">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase">Min Observed Pressure</span>
                    <div className="text-base font-bold text-cyan-400 mt-1">
                      {currentEvent.minimumObservedPressurePsi.toFixed(1)} psi
                    </div>
                    <span className="text-[10px] text-slate-500">&lt; 15 psi = Back-siphon risk</span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase">Shutoff Duration</span>
                    <div className="text-base font-bold text-amber-400 mt-1">
                      {currentEvent.interruptionDurationHours.toFixed(1)} hrs
                    </div>
                    <span className="text-[10px] text-slate-500">Stagnancy risk window</span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase">Turbidity</span>
                    <div className="text-base font-bold text-slate-200 mt-1">
                      {currentZone.currentTelemetry.turbidityNtu?.toFixed(2) || '0.35'} NTU
                    </div>
                    <span className="text-[10px] text-slate-500">Standard: &lt;= 1.0 NTU</span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase">Risk Engine Score</span>
                    <div className="text-base font-bold text-purple-400 mt-1">
                      {currentEvent.riskEvaluation.score} / 100
                    </div>
                    <span className="text-[10px] text-slate-500">Level: {currentEvent.riskEvaluation.level}</span>
                  </div>
                </div>

                {/* Risk Contributors */}
                <div>
                  <h4 className="text-[11px] font-bold text-slate-300 uppercase mb-2">
                    Deterministic Risk Engine Rule Breakdown:
                  </h4>
                  <div className="space-y-1.5">
                    {currentEvent.riskEvaluation.contributors.map((c, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded bg-slate-900 border border-slate-800 flex items-center justify-between text-[11px]"
                      >
                        <span className="text-slate-300">{c.explanation}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                            c.severity === 'HIGH'
                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                              : 'bg-amber-950 text-amber-300 border border-amber-800'
                          }`}
                        >
                          {c.severity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
