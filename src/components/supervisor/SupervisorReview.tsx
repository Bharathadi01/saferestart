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
  // Find events that can be reviewed
  const reviewableEvents = Object.values(events).filter(
    (e) => e.state === 'AWAITING_APPROVAL' || e.state === 'HOLD' || e.state === 'VERIFICATION_REQUIRED'
  );

  const [selectedEventId, setSelectedEventId] = useState<string>(
    reviewableEvents.find((e) => e.state === 'AWAITING_APPROVAL')?.id ||
      reviewableEvents[0]?.id ||
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

  // Gating Validation:
  const hasVerificationSubmission = !!currentEvent?.verificationSubmission;
  const chlorinePassing =
    (currentEvent?.verificationSubmission?.freeChlorineMgL || 0) >=
    DEMO_THRESHOLDS.MIN_REQUIRED_FREE_CHLORINE_MG_L;
  const pressurePassing =
    (currentEvent?.verificationSubmission?.observedPressurePsi || 0) >=
    DEMO_THRESHOLDS.MIN_NORMAL_PRESSURE_PSI;
  const flushingPassing = !!currentEvent?.verificationSubmission?.flushingCompleted;
  const noMissingEvidence = (currentEvent?.riskEvaluation?.missingEvidence?.length || 0) === 0;

  const isEligibleForApproval =
    currentEvent?.state === 'AWAITING_APPROVAL' &&
    hasVerificationSubmission &&
    chlorinePassing &&
    pressurePassing &&
    flushingPassing &&
    noMissingEvidence;

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
              ? 'Zone service RESTORED! Safe drinking water released to network.'
              : actionType === 'REQUEST_MORE_VERIFICATION'
              ? 'Additional field verification directive issued. Event returned to VERIFICATION_REQUIRED.'
              : 'Zone maintained on operational HOLD. Field remediation required.',
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
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2.5 rounded-lg bg-purple-950 text-purple-300 border border-purple-800 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold font-mono text-slate-100 uppercase tracking-wider">
              Supervisor Verification & Release Authorization Gate
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              Statutory sign-off required prior to releasing intermittently supplied drinking water
            </p>
          </div>
        </div>

        {/* Event Selector */}
        <div className="mt-4 pt-4 border-t border-slate-800">
          <label className="block text-slate-400 font-mono text-[11px] uppercase mb-1.5 font-semibold">
            Select Restart Request to Review:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-xs">
            {reviewableEvents.map((evt) => {
              const z = zones.find((item) => item.id === evt.zoneId);
              const isSelected = selectedEventId === evt.id;
              return (
                <button
                  key={evt.id}
                  onClick={() => {
                    setSelectedEventId(evt.id);
                    setFeedback(null);
                  }}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    isSelected
                      ? 'bg-slate-800 border-cyan-500 text-cyan-200 ring-1 ring-cyan-500'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold flex items-center justify-between">
                    <span>{evt.id}</span>
                    <span className="text-[10px] uppercase font-normal">{evt.state}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate mt-0.5">{z?.name}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {currentEvent && currentZone ? (
        <div className="space-y-5">
          {/* Gate Status Banner */}
          <div
            className={`p-4 rounded-lg border font-mono text-xs flex items-start space-x-3 ${
              isEligibleForApproval
                ? 'bg-emerald-950/30 border-emerald-800 text-emerald-200'
                : 'bg-amber-950/30 border-amber-800 text-amber-200'
            }`}
          >
            {isEligibleForApproval ? (
              <Unlock className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <Lock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <span className="font-bold uppercase tracking-wider text-sm">
                {isEligibleForApproval
                  ? 'APPROVAL GATE UNLOCKED: ALL STATUTORY CRITERIA SATISFIED'
                  : 'RESTRICTION: RESTORATION APPROVAL CURRENTLY BLOCKED'}
              </span>
              <p className="text-xs opacity-90 leading-relaxed">
                {isEligibleForApproval
                  ? 'Field verification checklists, required chlorine thresholds, and main flushing have been verified. Authorized personnel may approve release.'
                  : `This event cannot be restored because mandatory evidence requirements or state prerequisites are incomplete. State: ${currentEvent.state}. Missing evidence items: ${currentEvent.riskEvaluation.missingEvidence.join(', ') || 'Awaiting field submission'}.`}
              </p>
            </div>
          </div>

          {/* Submitted Field Evidence Audit */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 font-mono text-xs space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200 border-b border-slate-800 pb-2 flex items-center space-x-2">
              <FileCheck className="w-4 h-4 text-cyan-400" />
              <span>Evidence Verification Audit Checklist</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Chlorine Check */}
              <div
                className={`p-3 rounded border ${
                  chlorinePassing ? 'bg-slate-950 border-emerald-900/60' : 'bg-rose-950/30 border-rose-900/60'
                }`}
              >
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span>Free Chlorine Residual</span>
                  <span className={chlorinePassing ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                    {chlorinePassing ? 'PASS' : 'FAIL / MISSING'}
                  </span>
                </div>
                <div className="text-lg font-bold text-slate-200 mt-1">
                  {currentEvent.verificationSubmission?.freeChlorineMgL !== undefined
                    ? `${currentEvent.verificationSubmission.freeChlorineMgL.toFixed(2)} mg/L`
                    : 'No Reading'}
                </div>
                <span className="text-[10px] text-slate-500">
                  Required: &gt;= {DEMO_THRESHOLDS.MIN_REQUIRED_FREE_CHLORINE_MG_L} mg/L
                </span>
              </div>

              {/* Observed Pressure Check */}
              <div
                className={`p-3 rounded border ${
                  pressurePassing ? 'bg-slate-950 border-emerald-900/60' : 'bg-rose-950/30 border-rose-900/60'
                }`}
              >
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span>Observed System Pressure</span>
                  <span className={pressurePassing ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                    {pressurePassing ? 'PASS' : 'LOW / UNVERIFIED'}
                  </span>
                </div>
                <div className="text-lg font-bold text-slate-200 mt-1">
                  {currentEvent.verificationSubmission?.observedPressurePsi !== undefined
                    ? `${currentEvent.verificationSubmission.observedPressurePsi.toFixed(1)} psi`
                    : 'No Reading'}
                </div>
                <span className="text-[10px] text-slate-500">
                  Required: &gt;= {DEMO_THRESHOLDS.MIN_NORMAL_PRESSURE_PSI} psi
                </span>
              </div>

              {/* Flushing Check */}
              <div
                className={`p-3 rounded border ${
                  flushingPassing ? 'bg-slate-950 border-emerald-900/60' : 'bg-amber-950/30 border-amber-900/60'
                }`}
              >
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span>Main Scouring & Flushing</span>
                  <span className={flushingPassing ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                    {flushingPassing ? 'VERIFIED' : 'PENDING'}
                  </span>
                </div>
                <div className="text-sm font-semibold text-slate-200 mt-1">
                  {flushingPassing ? 'Completed by field crew' : 'Not recorded'}
                </div>
                <span className="text-[10px] text-slate-500">Purges stagnant bio-deposits</span>
              </div>

              {/* Leak Resolution Check */}
              <div className="p-3 rounded border bg-slate-950 border-slate-800">
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span>Physical Integrity Verification</span>
                  <span className="text-emerald-400 font-bold">SECURED</span>
                </div>
                <div className="text-sm font-semibold text-slate-200 mt-1">
                  No active breaches reported
                </div>
                <span className="text-[10px] text-slate-500">Ingress pathways isolated</span>
              </div>
            </div>

            {currentEvent.verificationSubmission && (
              <div className="p-3 rounded bg-slate-950 border border-slate-800 text-[11px] space-y-1">
                <span className="text-slate-400 font-bold">Field Technician Submission Note:</span>
                <p className="text-slate-300 italic">
                  &quot;{currentEvent.verificationSubmission.notes}&quot;
                </p>
                <div className="text-[10px] text-slate-500 pt-1">
                  Submitted by: {currentEvent.verificationSubmission.submittedBy} at{' '}
                  {new Date(currentEvent.verificationSubmission.timestamp).toLocaleTimeString()}
                </div>
              </div>
            )}
          </div>

          {/* Supervisor Authorization Action Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 font-mono text-xs space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200 border-b border-slate-800 pb-2 flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span>Supervisor Authorization Actions</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1 text-[11px] font-semibold">
                  Authorized Operator Name:
                </label>
                <input
                  type="text"
                  value={supervisorName}
                  onChange={(e) => setSupervisorName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 text-[11px] font-semibold">
                  Authorization Role:
                </label>
                <select
                  value={supervisorRole}
                  onChange={(e) =>
                    setSupervisorRole(e.target.value as 'SUPERVISOR' | 'CHIEF_WATER_ENGINEER')
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="SUPERVISOR">Distribution Operations Supervisor</option>
                  <option value="CHIEF_WATER_ENGINEER">Chief Water Works Engineer</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 text-[11px] font-semibold">
                Decision Rationale (Immutable Audit Log Entry):
              </label>
              <textarea
                rows={2}
                value={rationale}
                onChange={(e) => setRationale(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <label className="flex items-start space-x-2.5 cursor-pointer p-3 rounded bg-slate-950 border border-slate-800">
              <input
                type="checkbox"
                checked={complianceChecked}
                onChange={(e) => setComplianceChecked(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-cyan-500 bg-slate-900 border-slate-700"
              />
              <span className="text-slate-300 text-[11px] leading-relaxed">
                I hereby certify that all field telemetry, disinfection records, and scouring protocols were reviewed against demonstration guidelines before service resumption.
              </span>
            </label>

            {/* Feedback alert */}
            {feedback && (
              <div
                className={`p-3.5 rounded border text-xs ${
                  feedback.type === 'success'
                    ? 'bg-emerald-950/40 border-emerald-800 text-emerald-200'
                    : 'bg-rose-950/40 border-rose-800 text-rose-200'
                }`}
              >
                {feedback.message}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleDecision('APPROVE')}
                disabled={isSubmitting || !isEligibleForApproval || !complianceChecked}
                className="w-full sm:w-1/2 py-3 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-slate-950 font-bold uppercase tracking-wider text-xs transition-colors flex items-center justify-center space-x-2 shadow-lg disabled:text-slate-500"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Authorize Service Restoration</span>
              </button>

              <button
                type="button"
                onClick={() => handleDecision('REQUEST_MORE_VERIFICATION')}
                disabled={isSubmitting}
                className="w-full sm:w-1/4 py-3 px-4 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 font-bold uppercase tracking-wider text-xs transition-colors flex items-center justify-center space-x-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Request More Checks</span>
              </button>

              <button
                type="button"
                onClick={() => handleDecision('REJECT_HOLD')}
                disabled={isSubmitting}
                className="w-full sm:w-1/4 py-3 px-4 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 font-bold uppercase tracking-wider text-xs transition-colors flex items-center justify-center space-x-1.5"
              >
                <AlertOctagon className="w-3.5 h-3.5" />
                <span>Enforce HOLD</span>
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
